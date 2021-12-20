# Coral Marketplace frontend

<p align="center">
<img style="text-align:center;" src="/images/coral.png">
</p>

An NFT marketplace for the [Reef Network](https://reef.finance/).

![screenshot1](/images/screenshot-1.png)

## Features
- NFTs creation: Create ERC721 NFTs, with optional royalties (implementing [EIP-2981: NFT Royalty Standard](https://eips.ethereum.org/EIPS/eip-2981)) and choose if you want to lock the properties of the NFT or want it to be mutable.
- Direct sales: Sell and buy NFTs at a fixed price.
- Auction: Create and bid in auctions with a specific deadline, with the option of setting a minimum bid. To avoid saturation in "last minute bids", if a bid is created in the last 10 minutes of the auction, the deadline will be increased in 10 minutes more.
- Raffles: Create raffles and enter them to win NFTs. When the deadline of the raffle is reached, the winner will be chosen randomly weighing the amount participated (the higher the amount, the higher your chances). The winner will receive the NFT and the seller will received all the amount participated, minues market fees and royalties.
- Lending: A user can create a loan proposal with an NFT as collateral. If a funder wants to lend the amount requested, will receive a payback fee, or get the ownership of the NFT in case of non-payment.


## Use Coral Marketplace

You can access Coral Marketplace web app in:
 - https://coral-marketplace.web.app/


At the moment, to interact with the application, you would need to use [polkadot.js](https://polkadot.js.org/extension/) or [Reef.js](https://github.com/reef-defi/browser-extension) extensions in a desktop device. 
You can see [here](https://www.youtube.com/watch?v=FdWmdGZfXw4) how to set up your Reef account.

## Development
This project has been created with [Angular 12](https://angular.io/).

It requires to have [Node](https://nodejs.org/en/) and [Yarn](https://yarnpkg.com/) installed. It is also advisable to install the [Angular CLI](https://angular.io/cli).

Install dependencies
```sh
yarn install
```

Start application
```sh
ng serve
```

The application will open in _localhost:4200_.


## Future developments

These are some of the features planned for future developments:
- Mobile support.
- Dynamic royalties based on the number of sales
- NFT collections
- Support for more file formats
- Ratings system
- Bulk upload
- Notifications


## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
