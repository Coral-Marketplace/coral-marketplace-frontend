import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BACKEND_URL } from '../_config/config';
import { Observable } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class MarketItemService {

	MARKET_ITEM_URL  = 'market-item';

	constructor(private httpClient: HttpClient) { }

    getMarketItem(id: number): Observable<any> {
        return this.httpClient.get<any>(`${BACKEND_URL}/${this.MARKET_ITEM_URL}/${id}`);
    }

	createMarketItem(marketItem: any): Observable<any> {
        return this.httpClient.post<any>(`${BACKEND_URL}/${this.MARKET_ITEM_URL}`, marketItem);
    }

    updateMarketItem(marketItem: any): Observable<any> {
        return this.httpClient.put<any>(`${BACKEND_URL}/${this.MARKET_ITEM_URL}`, marketItem);
    }
}
