class AccountStore {

    constructor() {

        this.balance = 0;

        this.userId = null;

        this.assets = [];

    }

    update(account) {

        this.userId =
            account.userId;

        this.assets =
            account.balances || [];

        let totalBalance = 0;

        for (const asset of this.assets) {

            totalBalance += Number(

                asset.free ||

                asset.balance ||

                0

            );

        }

        this.balance =
            totalBalance;

    }

    getBalance() {

        return this.balance;

    }

}

export default new AccountStore();