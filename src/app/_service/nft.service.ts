import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ReefService } from './reef.service';
import { checkAccountAndClaim } from '../_utils/utils';

@Injectable({
  providedIn: 'root'
})
export class NftService {

  constructor(private reefService: ReefService) { }

  async createNft(ipfsMetadataUrl: string, royaltiesAmount: number, mutable: boolean): Promise<number> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

    const tx1 = await this.reefService.nftContract.connect(this.reefService.selectedSigner.signer)
      .createToken(ipfsMetadataUrl, this.reefService.selectedSigner.evmAddress, royaltiesAmount, mutable);
    const receipt1 = await tx1.wait();
    const tokenId = receipt1.events[0].args[2].toNumber();

    return tokenId;
  }

  async updateNft(tokenId: number, ipfsMetadataUrl: string): Promise<boolean> {
    if (!(await checkAccountAndClaim(this.reefService.selectedSigner.signer))) {
      throw new Error('No EVM account available');
    }

    const tx1 = await this.reefService.nftContract.connect(this.reefService.selectedSigner.signer)
      .setTokenURI(tokenId, ipfsMetadataUrl);
    await tx1.wait();

    return true;
  }

}

