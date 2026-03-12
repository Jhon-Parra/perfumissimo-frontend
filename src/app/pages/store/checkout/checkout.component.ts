import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart/cart.service';
import { OrderService, CreateOrderDto } from '../../../core/services/order/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { WompiService, WompiPseBank } from '../../../core/services/payment/wompi.service';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {

    cartItems: CartItem[] = [];
    cartTotal = 0;

    shippingAddress = '';
    isPlacingOrder = false;
    orderSuccess = false;
    createdOrderId = '';
    errorMsg = '';
    private attemptedRefresh = false;

    paymentMethod: 'COD' | 'WOMPI_PSE' = 'COD';

    wompiAcceptanceToken = '';
    wompiTermsUrl = '';
    wompiMerchantName = '';
    wompiBanks: WompiPseBank[] = [];
    wompiLoading = false;

    pseUserType: '0' | '1' = '0';
    pseLegalIdType = 'CC';
    pseLegalId = '';
    pseBankCode = '';
    pseAcceptedTerms = false;

    constructor(
        public cartService: CartService,
        private orderService: OrderService,
        public authService: AuthService,
        private wompiService: WompiService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Usar la suscripción correcta del CartService (items$)
        this.cartService.items$.subscribe((items: CartItem[]) => {
            this.cartItems = items;
            this.cartTotal = items.reduce(
                (sum: number, i: CartItem) => sum + (i.product.price * i.quantity), 0
            );
        });

        // Prefetch si el usuario llega directo con PSE seleccionado por default en el futuro
        if (this.paymentMethod === 'WOMPI_PSE') {
            this.loadWompiData();
        }
    }

    onPaymentMethodChange(): void {
        this.errorMsg = '';
        if (this.paymentMethod === 'WOMPI_PSE') {
            this.loadWompiData();
        }
    }

    private loadWompiData(): void {
        if (this.wompiLoading) return;
        if (this.wompiAcceptanceToken && this.wompiBanks.length) return;

        this.wompiLoading = true;
        this.wompiService.getMerchant().subscribe({
            next: (m) => {
                this.wompiAcceptanceToken = m?.presigned_acceptance?.acceptance_token || '';
                this.wompiTermsUrl = m?.presigned_acceptance?.permalink || '';
                this.wompiMerchantName = m?.name || '';

                this.wompiService.getPseBanks().subscribe({
                    next: (b) => {
                        this.wompiBanks = Array.isArray(b?.data) ? b.data : [];
                        this.wompiLoading = false;
                    },
                    error: (err) => {
                        console.error('Error cargando bancos PSE:', err);
                        this.wompiBanks = [];
                        this.wompiLoading = false;
                    }
                });
            },
            error: (err) => {
                console.error('Error cargando merchant Wompi:', err);
                this.wompiAcceptanceToken = '';
                this.wompiTermsUrl = '';
                this.wompiMerchantName = '';
                this.wompiBanks = [];
                this.wompiLoading = false;
            }
        });
    }

    placeOrder(): void {
        if (!this.shippingAddress.trim()) {
            this.errorMsg = 'Por favor ingresa tu dirección de envío.';
            return;
        }

        if (this.cartItems.length === 0) {
            this.errorMsg = 'Tu carrito está vacío.';
            return;
        }

        const hasInvalid = this.cartItems.some((i) => !i?.product?.id || !Number.isFinite(Number(i.product.price)));
        if (hasInvalid) {
            this.errorMsg = 'Hay productos inválidos en el carrito. Vacía el carrito y vuelve a intentarlo.';
            return;
        }

        this.isPlacingOrder = true;
        this.errorMsg = '';

        if (this.paymentMethod === 'WOMPI_PSE') {
            this.submitWompiPse();
        } else {
            this.submitOrder();
        }
    }

    private submitWompiPse(): void {
        if (!this.wompiAcceptanceToken || !this.wompiTermsUrl) {
            this.errorMsg = 'No se pudo cargar Wompi. Intenta de nuevo.';
            this.isPlacingOrder = false;
            return;
        }
        if (!this.pseAcceptedTerms) {
            this.errorMsg = 'Debes aceptar los términos de Wompi para continuar.';
            this.isPlacingOrder = false;
            return;
        }
        if (!String(this.pseLegalId).trim()) {
            this.errorMsg = 'Ingresa tu número de documento para PSE.';
            this.isPlacingOrder = false;
            return;
        }
        if (!String(this.pseBankCode).trim()) {
            this.errorMsg = 'Selecciona un banco para PSE.';
            this.isPlacingOrder = false;
            return;
        }

        const payload = {
            ...this.buildOrderData(),
            acceptance_token: this.wompiAcceptanceToken,
            user_type: this.pseUserType,
            user_legal_id_type: this.pseLegalIdType,
            user_legal_id: String(this.pseLegalId).trim(),
            financial_institution_code: this.pseBankCode
        };

        this.wompiService.createPseCheckout(payload as any).subscribe({
            next: (res) => {
                this.isPlacingOrder = false;
                // Redirigir a PSE (Wompi)
                window.location.href = res.asyncPaymentUrl;
            },
            error: (err) => {
                console.error('Error creando checkout PSE:', err);
                const msg = err?.error?.message || err?.error?.error || err?.error?.detail || 'No se pudo iniciar el pago con PSE.';
                this.errorMsg = msg;
                this.isPlacingOrder = false;
            }
        });
    }

    private buildOrderData(): CreateOrderDto {
        return {
            total: this.cartTotal,
            shipping_address: this.shippingAddress,
            items: this.cartItems.map((item: CartItem) => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: Number(item.product.price)
            }))
        };
    }

    private submitOrder(): void {
        const orderData = this.buildOrderData();

        this.orderService.createOrder(orderData).subscribe({
            next: (response) => {
                this.createdOrderId = response.orderId;
                this.cartService.clearCart();
                this.isPlacingOrder = false;
                this.router.navigate(['/order-success', response.orderId]);
            },
            error: (err) => {
                console.error('Error al crear orden:', err);
                const status = err?.status;

                if ((status === 401 || status === 403) && !this.attemptedRefresh) {
                    this.attemptedRefresh = true;
                    this.authService.refreshUser().subscribe({
                        next: () => {
                            this.submitOrder();
                        },
                        error: () => {
                            this.isPlacingOrder = false;
                            this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
                        }
                    });
                    return;
                }

                if (status === 0) {
                    this.errorMsg = 'No se pudo conectar con el servidor. Revisa que el backend esté activo.';
                } else {
                    this.errorMsg = err?.error?.message || err?.error?.error || 'Error al procesar tu pedido. Inténtalo de nuevo.';
                }
                this.isPlacingOrder = false;
            }
        });
    }

    /** Shortcut helpers para el template */
    getItemPrice(item: CartItem): number {
        return item.product.price * item.quantity;
    }

    getItemImage(item: CartItem): string {
        return item.product.imageUrl || 'https://images.unsplash.com/photo-1594035910387-fea47714263f?q=80&w=100';
    }
}
