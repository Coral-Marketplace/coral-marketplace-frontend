import { Component, Input } from '@angular/core';
import { Collection } from 'src/app/_model/collection';

@Component({
  selector: 'app-collection-list',
  templateUrl: './collection-list.component.html'
})
export class CollectionListComponent {

  @Input() collections: Collection[];
  @Input() emptyMessageKey: string;

}
