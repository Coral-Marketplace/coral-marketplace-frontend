import { Injectable } from '@angular/core';
import NftAbi from '../_contracts/CoralNFT.json';
import MarketAbi from '../_contracts/CoralMarketplace.json';
import LoanAbi from '../_contracts/CoralLoan.json';
import { Provider, Signer } from '@reef-defi/evm-provider';
import { environment } from 'src/environments/environment';
import { WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import type { Signer as InjectedSigner } from '@polkadot/api/types';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { stringToHex } from '@polkadot/util';
import { BehaviorSubject } from 'rxjs';
import { ethers } from 'ethers';
import { getSignerPointer, saveSignerPointer } from './localStore';
import { ReefSigner } from '../_model/reefSigner';
import { NetworkConfig } from '../_model/networkConfig';
import { REEF_MAINNET, REEF_TESTNET, SIGN_MESSAGE } from '../_config/config';
import * as identicon from '@polkadot/ui-shared';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class ReefService {
  evmProvider: Provider;
  signers: ReefSigner[];
  selectedSigner: ReefSigner;

  nftContract: ethers.Contract;
  marketContract: ethers.Contract;
  loanContract: ethers.Contract;
  network: NetworkConfig = environment.reefTestnet ? REEF_TESTNET : REEF_MAINNET;

  signersSubject = new BehaviorSubject<ReefSigner[]|null>(null);
  existsProviderSubject = new BehaviorSubject<boolean>(false);
  selectedSignerSubject = new BehaviorSubject<ReefSigner|null>(null);
  marketFeeSubject = new BehaviorSubject<number>(0);

  constructor(private sanitizer: DomSanitizer,
              private translate: TranslateService,
              private toastr: ToastrService) { 
    this.nftContract = new ethers.Contract(this.network.nftContractAddress, NftAbi as any);
    this.marketContract = new ethers.Contract(this.network.marketplaceContractAddress, MarketAbi as any);
    this.loanContract = new ethers.Contract(this.network.loanContractAddress, LoanAbi as any);

    this.initEvmProvider();
  }

  /**
   * Init EVM provider
   */
  private async initEvmProvider(): Promise<any> {
    const evmProvider = new Provider({ provider: new WsProvider(this.network.rpcUrl) });
    await evmProvider.api.isReadyOrError;

    this.evmProvider = evmProvider;
    this.existsProviderSubject.next(true);
    this.connect();
    // Get market fee
    const marketFee = await this.marketContract.connect(this.evmProvider).getMarketFee();
    this.marketFeeSubject.next(Number(marketFee)/100);
  };

  /**
   * Connect to wallet, get available Reef signers and initial signer selection
   */
  async connect() {
    const signers = await this.getSigners();
    const signerPointer = getSignerPointer();
    const selectedAccountIndex = signers.length > signerPointer ? signerPointer : 0;
    signers[selectedAccountIndex].selected = true;

    this.selectedSigner = signers[selectedAccountIndex];
    this.selectedSignerSubject.next(this.selectedSigner);
    this.signers = signers;
    
    this.signersSubject.next(signers);
  }

  updateSelectedSigner(newSelection: ReefSigner) {
    saveSignerPointer(this.signers.indexOf(newSelection));
    this.signers.forEach(sig => sig.selected = newSelection == sig);
    this.selectedSigner = newSelection;
    this.selectedSignerSubject.next(this.selectedSigner);
    this.signersSubject.next(this.signers);
  }


  async signMessage(message: string): Promise<string> {
    message = SIGN_MESSAGE + message;

    const signRaw = this.selectedSigner?.signer?.signingKey?.signRaw;

    if (signRaw) {
      const result = await signRaw({
        address: this.selectedSigner.address,
        data: stringToHex(message),
        type: 'bytes'
      });

      return result.signature;
    } else {
      throw new Error('Unable to sign message');
    }
  }


  /**
  * Helper method to connect and return promise with Reef signers
  */
  private async getSigners(): Promise<ReefSigner[]> {
    const inj = await web3Enable('Coral Marketplace');
    if (!inj.length) {
      this.toastr.info(
        this.translate.instant('toast.extension-disabled'),
        ''
      );
      throw new Error('Reef.js/Polkadot.js extension is disabled!');
    } 

    const web3accounts = await web3Accounts();
    if (!web3accounts.length) {
      this.toastr.info(
        this.translate.instant('toast.account-needed'),
        ''
      );
      throw new Error('To use this app you need to create an account in Reef.js or Polkadot.js extension!');
    } 

    const signers = await this.accountsToSigners(web3accounts, this.evmProvider, inj[0].signer);
    return signers;
  };

  /**
   * Helper method to convert accounts to signers
   */
  private accountsToSigners = async (accounts: InjectedAccountWithMeta[], provider: Provider, sign: InjectedSigner): Promise<ReefSigner[]> => Promise.all(
    accounts
      .map((account) => ({
        address: account.address,
        name: account.meta.name || '',
        selected: false,
        signer: new Signer(provider, account.address, sign)
      }))
      .map(async (signer): Promise<ReefSigner> => ({
        ...signer,
        evmAddress: await signer.signer.getAddress(),
        isEvmClaimed: await signer.signer.isClaimed(),
        identicon: this.generateIdenticon(signer.address)
      }))
  );

  private generateIdenticon(address: string): SafeHtml {
    let circles = identicon.polkadotIcon(address, {isAlternative: false});

    const circlesStr = circles.map(({ cx, cy, fill, r }) =>
      `<circle cx=${cx} cy=${cy} fill="${fill}" r=${r} />`
    ).join('');

    return this.sanitizer.bypassSecurityTrustHtml(`<svg height=36 viewBox='0 0 64 64' width=36>${circlesStr}</svg>`);
  }

}

