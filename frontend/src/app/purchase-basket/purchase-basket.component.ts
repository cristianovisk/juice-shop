import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { BasketService } from '../Services/basket.service'
import { UserService } from '../Services/user.service'
import { library, dom } from '@fortawesome/fontawesome-svg-core'
import { faTrashAlt } from '@fortawesome/free-regular-svg-icons/'
import { faMinusSquare,faPlusSquare } from '@fortawesome/free-solid-svg-icons'

library.add(faTrashAlt, faMinusSquare, faPlusSquare)
dom.watch()

@Component({
  selector: 'app-purchase-basket',
  templateUrl: './purchase-basket.component.html',
  styleUrls: ['./purchase-basket.component.scss']
})
export class PurchaseBasketComponent implements OnInit {

  @Input('allowEdit') public allowEdit: boolean = false
  @Input('displayTotal') public displayTotal: boolean = false
  @Output() emitTotal = new EventEmitter()
  @Output() emitProductCount = new EventEmitter()
  public tableColumns = ['image', 'product','price','quantity','total price']
  public dataSource = []
  public bonus = 0
  public itemTotal = 0
  public error = undefined
  public userEmail: string
  constructor (private basketService: BasketService, private userService: UserService) { }

  ngOnInit () {
    if (this.allowEdit && !this.tableColumns.includes('remove')) {
      this.tableColumns.push('remove')
    }
    this.load()
    this.userService.whoAmI().subscribe((data) => {
      this.userEmail = data.email || 'anonymous'
      this.userEmail = '(' + this.userEmail + ')'
    },(err) => console.log(err))
  }

  load () {
    this.basketService.find(parseInt(sessionStorage.getItem('bid'), 10)).subscribe((basket) => {
      this.dataSource = basket.Products
      this.itemTotal = basket.Products.reduce((itemTotal, product) => itemTotal + product.price * product.BasketItem.quantity, 0)
      this.bonus = basket.Products.reduce((bonusPoints, product) => bonusPoints + Math.round(product.price / 10) * product.BasketItem.quantity, 0)
      this.sendToParent(this.dataSource.length)
    },(err) => console.log(err))
  }

  delete (id) {
    this.basketService.del(id).subscribe(() => {
      this.load()
    }, (err) => console.log(err))
  }

  inc (id) {
    this.addToQuantity(id,1)
  }

  dec (id) {
    this.addToQuantity(id,-1)
  }

  addToQuantity (id,value) {
    this.error = null
    this.basketService.get(id).subscribe((basketItem) => {
      let newQuantity = basketItem.quantity + value
      this.basketService.put(id, { quantity: newQuantity < 1 ? 1 : newQuantity }).subscribe(() => {
        this.load()
      },(err) => {
        {
          this.error = err.error
          console.log(err)
        }
      })
    }, (err) => console.log(err))
  }

  sendToParent (count) {
    this.emitTotal.emit([this.itemTotal, this.bonus])
    this.emitProductCount.emit(count)
  }
}
