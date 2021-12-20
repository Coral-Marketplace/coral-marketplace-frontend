import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BACKEND_URL } from '../_config/config';
import { Observable } from 'rxjs';
import { Collection } from '../_model/collection';

@Injectable({
	providedIn: 'root'
})
export class CollectionService {

	COLLECTION_URL = 'collection';

	constructor(private httpClient: HttpClient) { }

	getCollection(collectionId: number): Observable<Collection> {
        return this.httpClient.get<Collection>(`${BACKEND_URL}/${this.COLLECTION_URL}/${collectionId}`);
    }

	getAllCollections(): Observable<Collection[]> {
        return this.httpClient.get<Collection[]>(`${BACKEND_URL}/${this.COLLECTION_URL}`);
    }

	getUserCollections(userPublicAddress: string): Observable<Collection[]> {
        return this.httpClient.get<Collection[]>(`${BACKEND_URL}/${this.COLLECTION_URL}/by-user/${userPublicAddress}`);
    }

	createCollection(collection: Collection): Observable<Collection> {
        const formData: FormData = new FormData();
		formData.append('name', collection.name);
        formData.append('description', collection.description ? collection.description : '');
        formData.append('logo', collection.logoFile);
		formData.append('banner', collection.bannerFile);
        return this.httpClient.post<Collection>(`${BACKEND_URL}/${this.COLLECTION_URL}`, formData);
    }

    updateCollection(collection: Collection): Observable<Collection> {
        const formData: FormData = new FormData();
		formData.append('name', collection.name);
        formData.append('description', collection.description ? collection.description : '');
        formData.append('logo', collection.logoFile ? collection.logoFile : '');
		formData.append('banner', collection.bannerFile);
        return this.httpClient.post<Collection>(`${BACKEND_URL}/${this.COLLECTION_URL}/${collection.id}`, formData);
    }

    addItems(id: number, itemIds: number[]): Observable<Collection> {
        return this.httpClient.post<Collection>(`${BACKEND_URL}/${this.COLLECTION_URL}/add-items/${id}`, itemIds);
    }

	deleteCollection(collectionId: number): Observable<any> {
        return this.httpClient.delete<any>(`${BACKEND_URL}/${this.COLLECTION_URL}/${collectionId}`);
    }
}