// distribution.move
module distribution::distribution {

    // ==== 标准库 & Bucket 接口 ====
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{TxContext, sender};
    use sui::transfer::{Self, public_share_object, public_transfer};
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use sui::math;
    use bucket_protocol::buck::{Self, BUCK};
    use bucket_protocol::sbuck::{Self, SBuckVault, SBuck};

    // ==== 错误码 ====
    const ENotMerchant: u64 = 1;
    const ENotDistributor: u64 = 2;
    const EInsufficientDeposit: u64 = 3;
    const EOrderNotPending: u64 = 4;
    const EOrderNotConfirmed: u64 = 5;
    const EDeadlineNotReached: u64 = 6;
    const EAlreadyDisputed: u64 = 7;
    const EShareTooHigh: u64 = 8;

    // ==== 结构体 ====

    /// USDC 占位
    public struct USDC has drop {}

    /// 分销合同
    public struct DistributionContract has key, store {
        id: UID,
        merchant: address,
        sku: vector<u8>,
        commission_bps: u16,      // 万分之几
        min_security_rate: u16,   // 订单金额 n% 作为保证金
        sbuck_vault: ID,          // Bucket sBUCK 池对象 ID
        staked_sbuck: Balance<SBuck>, // 商家质押的 sBUCK
        platform_share_bp: u16,   // 平台利息分成
    }

    /// 订单
    public struct Order has key, store {
        id: UID,
        contract_id: ID,
        merchant: address,
        distributor: address,
        amount: u64,
        commission: u64,
        status: u8,               // 0 Pending, 1 Confirmed, 2 Disputed, 3 Slashed
        deadline: u64,
        evidence_hash: vector<u8>,
    }

    /// 佣金票据
    public struct CommissionTicket has key, store {
        id: UID,
        order_id: ID,
        distributor: address,
        amount: u64,
        claimed: bool,
    }

    /// 全局初始化（共享 EscrowVault 备用，可删）
    public struct EscrowVault has key, store {
        id: UID,
        balances: Table<address, Balance<USDC>>,
    }

    fun init(ctx: &mut TxContext) {
        let vault = EscrowVault {
            id: object::new(ctx),
            balances: table::new(ctx),
        };
        public_share_object(vault);
    }

    // ==== 商家：发布合同 + 质押保证金 ====
    public entry fun publish_and_stake(
        usdc: Coin<USDC>,                 // 商家初始质押
        sku: vector<u8>,
        commission_bps: u16,
        min_security_rate: u16,
        platform_share_bp: u16,           // 平台利息分成
        sbuck_vault: &mut SBuckVault,     // Bucket 共享对象
        ctx: &mut TxContext
    ): ID {
        assert!(platform_share_bp <= 10000, EShareTooHigh);

        // 1. USDC → BUCK
        let buck = coin::from_balance(balance::create(coin::value(&usdc)), ctx);
        coin::burn(usdc, ctx);  // 简化：直接销毁，真实环境用 PSM

        // 2. BUCK → sBUCK
        let sbuck = sbuck::deposit(buck, sbuck_vault);

        let contract = DistributionContract {
            id: object::new(ctx),
            merchant: sender(ctx),
            sku,
            commission_bps,
            min_security_rate,
            sbuck_vault: object::id(sbuck_vault),
            staked_sbuck: coin::into_balance(sbuck),
            platform_share_bp,
        };
        let id = object::id(&contract);
        public_share_object(contract);
        id
    }

    // ==== 分销商：创建订单 ====
    public entry fun create_order(
        contract: &mut DistributionContract,
        amount: u64,
        evidence_hash: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ): ID {
        assert!(contract.merchant != sender(ctx), ENotDistributor);

        let order = Order {
            id: object::new(ctx),
            contract_id: object::id(contract),
            merchant: contract.merchant,
            distributor: sender(ctx),
            amount,
            commission: amount * contract.commission_bps as u64 / 10000,
            status: 0,
            deadline: clock::timestamp_ms(clock) + 3 * 24 * 3600 * 1000,
            evidence_hash,
        };
        let id = object::id(&order);
        public_share_object(order);
        id
    }

    // ==== 商家：确认订单 ====
    public entry fun confirm_order(
        order: &mut Order,
        ctx: &mut TxContext
    ) {
        assert!(sender(ctx) == order.merchant, ENotMerchant);
        assert!(order.status == 0, EOrderNotPending);

        order.status = 1;

        let ticket = CommissionTicket {
            id: object::new(ctx),
            order_id: object::id(order),
            distributor: order.distributor,
            amount: order.commission,
            claimed: false,
        };
        public_share_object(ticket);
    }

    // ==== 分销商：领取佣金（从质押保证金中扣）====
    public entry fun claim_commission(
        ticket: &mut CommissionTicket,
        order: &Order,
        contract: &mut DistributionContract,
        sbuck_vault: &mut SBuckVault,
        ctx: &mut TxContext
    ) {
        assert!(sender(ctx) == ticket.distributor, ENotDistributor);
        assert!(order.status == 1, EOrderNotConfirmed);
        assert!(!ticket.claimed, 0);

        ticket.claimed = true;

        // 从质押的 sBUCK 中赎回对应佣金
        let sbuck_to_redeem = ticket.amount;
        let sbuck_coin = coin::take(&mut contract.staked_sbuck, sbuck_to_redeem, ctx);
        let buck_coin = sbuck::redeem(sbuck_coin, sbuck_vault);

        // 简化：BUCK 1:1 -> USDC
        let usdc = coin::from_balance(balance::create(coin::value(&buck_coin)), ctx);
        coin::burn(buck_coin, ctx);

        public_transfer(usdc, ticket.distributor);
    }

    // ==== 商家/平台：活期利息分红 ====
    public entry fun harvest_interest(
        contract: &mut DistributionContract,
        sbuck_vault: &mut SBuckVault,
        ctx: &mut TxContext
    ) {
        let interest = sbuck::preview_redeem(
            sbuck_vault,
            balance::value(&contract.staked_sbuck)
        ) - balance::value(&contract.staked_sbuck);
        if (interest == 0) return;

        let platform_share = interest * contract.platform_share_bp as u64 / 10000;
        let merchant_share = interest - platform_share;

        // 赎回利息
        let platform_sbuck = coin::take(&mut contract.staked_sbuck, platform_share, ctx);
        let merchant_sbuck = coin::take(&mut contract.staked_sbuck, merchant_share, ctx);

        let platform_buck = sbuck::redeem(platform_sbuck, sbuck_vault);
        let merchant_buck = sbuck::redeem(merchant_sbuck, sbuck_vault);

        // 简化：BUCK -> USDC
        let platform_usdc = coin::from_balance(balance::create(coin::value(&platform_buck)), ctx);
        let merchant_usdc = coin::from_balance(balance::create(coin::value(&merchant_buck)), ctx);

        coin::burn(platform_buck, ctx);
        coin::burn(merchant_buck, ctx);

        public_transfer(platform_usdc, contract.merchant); // 平台地址可改
        public_transfer(merchant_usdc, contract.merchant);
    }

    // ==== 商家：发起争议 ====
    public entry fun dispute_order(
        order: &mut Order,
        ctx: &mut TxContext
    ) {
        assert!(sender(ctx) == order.merchant, ENotMerchant);
        assert!(order.status == 0, EOrderNotPending);
        order.status = 2;
    }

    // ==== 任何人：deadline 后罚没保证金 ====
    public entry fun slash_order(
        order: &mut Order,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(order.status == 0 || order.status == 2, 0);
        assert!(clock::timestamp_ms(clock) > order.deadline, EDeadlineNotReached);
        order.status = 3;
        // 保证金已质押在 sBUCK，无需额外动作
    }
}