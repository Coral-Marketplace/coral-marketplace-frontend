import { Signer } from '@reef-defi/evm-provider';
import { ethers } from 'ethers';

export async function checkAccountAndClaim(signer: Signer): Promise<boolean> {
    if (!(await signer.isClaimed())) {
            try {
            await signer.claimDefaultAccount();
            return true;
        } catch (e: any) {
            throw new Error(e);
        }
    } else {
        return true;
    }
}

export function bigNumberToNumber(bigNum: ethers.BigNumber): number {
    try {
        return Number(ethers.utils.formatUnits(bigNum.toString(), 'ether'));
    } catch(e: any) {
        console.log('Error formating BigNumber', e);
        return 0;
    }
}