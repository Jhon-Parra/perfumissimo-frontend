import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CartService, CartItem } from '../../../core/services/cart/cart.service';
import { OrderService, CreateOrderDto } from '../../../core/services/order/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { WompiService, WompiPseBank } from '../../../core/services/payment/wompi.service';
import { SettingsService, Settings } from '../../../core/services/settings/settings.service';

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {

    cartItems: CartItem[] = [];
    cartTotal = 0;

    envioPrioritario = false;
    perfumeLujo = false;
    envioPrioritarioPrecio = 0;
    perfumeLujoPrecio = 0;
    extrasTotal = 0;
    grandTotal = 0;

    private settingsSub: any;

    priorityShippingImg = '';
    luxuryPerfumeImg = '';

    shippingAddress = '';
    isPlacingOrder = false;
    orderSuccess = false;
    createdOrderId = '';
    errorMsg = '';
    private attemptedRefresh = false;

    paymentMethod: 'WOMPI_PSE' | 'WOMPI_NEQUI' | 'WOMPI_CARD' = 'WOMPI_PSE';

    wompiAcceptanceToken = '';
    wompiTermsUrl = '';
    wompiMerchantName = '';
    wompiBanks: WompiPseBank[] = [];
    wompiLoading = false;
    wompiBaseUrl = '';
    wompiPublicKey = '';

    pseUserType: '0' | '1' = '0';
    pseLegalIdType = 'CC';
    pseLegalId = '';
    pseBankCode = '';
    pseAcceptedTerms = false;

    nequiPhone = '';

    cardHolderName = '';
    cardNumber = '';
    cardExpMonth = '';
    cardExpYear = '';
    cardCvc = '';
    cardInstallments = 1;

    constructor(
        public cartService: CartService,
        private orderService: OrderService,
        public authService: AuthService,
        private wompiService: WompiService,
        private settingsService: SettingsService,
        private router: Router
    ) {
        this.priorityShippingImg = this.svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0f3d2e"/>
      <stop offset="1" stop-color="#c2a878"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="96" height="96" rx="18" fill="url(#g)"/>
  <path d="M24 58V41a5 5 0 0 1 5-5h32a5 5 0 0 1 5 5v17" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <path d="M66 45h7l7 9v4H66" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="35" cy="62" r="6" fill="#ffffff"/>
  <circle cx="67" cy="62" r="6" fill="#ffffff"/>
  <path d="M30 30h22" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <path d="M30 24h14" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
</svg>`);

        this.luxuryPerfumeImg = this.svgToDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#c2a878"/>
      <stop offset="1" stop-color="#0f3d2e"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="96" height="96" rx="18" fill="url(#g)"/>
  <path d="M40 20h16v9H40z" fill="#ffffff"/>
  <path d="M35 34h26v38a8 8 0 0 1-8 8H43a8 8 0 0 1-8-8V34z" fill="none" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>
  <path d="M35 48h26" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
  <path d="M48 40l3 6 7 1-5 4 1 7-6-3-6 3 1-7-5-4 7-1z" fill="#ffffff" opacity="0.9"/>
</svg>`);
    }

    ngOnInit(): void {
        // Usar la suscripción correcta del CartService (items$)
        this.cartService.items$.subscribe((items: CartItem[]) => {
            this.cartItems = items;
            this.cartTotal = items.reduce(
                (sum: number, i: CartItem) => sum + (i.product.price * i.quantity), 0
            );
            this.recalcTotals();
        });

        // Escuchar cambios de settings (el servicio puede devolver cache primero y refrescar luego)
        this.settingsSub = this.settingsService.settings$.subscribe((s) => {
            if (!s) return;
            this.envioPrioritarioPrecio = Number((s as any).envio_prioritario_precio || 0) || 0;
            this.perfumeLujoPrecio = Number((s as any).perfume_lujo_precio || 0) || 0;

            const envioImg = String((s as any).envio_prioritario_image_url || '').trim();
            const lujoImg = String((s as any).perfume_lujo_image_url || '').trim();
            if (envioImg) this.priorityShippingImg = envioImg;
            if (lujoImg) this.luxuryPerfumeImg = lujoImg;
            this.recalcTotals();
        });

        // Garantizar refresh al entrar a checkout
        this.settingsService.refreshSettings().subscribe({
            next: (s: Settings) => {
                this.envioPrioritarioPrecio = Number((s as any).envio_prioritario_precio || 0) || 0;
                this.perfumeLujoPrecio = Number((s as any).perfume_lujo_precio || 0) || 0;

                const envioImg = String((s as any).envio_prioritario_image_url || '').trim();
                const lujoImg = String((s as any).perfume_lujo_image_url || '').trim();
                if (envioImg) this.priorityShippingImg = envioImg;
                if (lujoImg) this.luxuryPerfumeImg = lujoImg;
                this.recalcTotals();
            },
            error: () => {
                // Mantener defaults
            }
        });

        // Prefetch si el usuario llega directo con PSE seleccionado por default en el futuro
        if (this.paymentMethod === 'WOMPI_PSE') {
            this.loadWompiData();
        }
    }

    ngOnDestroy(): void {
        try {
            this.settingsSub?.unsubscribe?.();
        } catch {
            // ignore
        }
    }

    onToggleExtras(): void {
        this.recalcTotals();
    }

    private recalcTotals(): void {
        const ep = this.envioPrioritario ? Math.max(0, Number(this.envioPrioritarioPrecio || 0)) : 0;
        const pl = this.perfumeLujo ? Math.max(0, Number(this.perfumeLujoPrecio || 0)) : 0;
        this.extrasTotal = ep + pl;
        this.grandTotal = this.cartTotal + this.extrasTotal;
    }

    private svgToDataUrl(svg: string): string {
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    onPaymentMethodChange(): void {
        this.errorMsg = '';
        if (this.paymentMethod === 'WOMPI_PSE' || this.paymentMethod === 'WOMPI_NEQUI' || this.paymentMethod === 'WOMPI_CARD') {
            this.loadWompiData();
        }
    }

    private loadWompiData(): void {
        if (this.wompiLoading) return;
        const needsBanks = this.paymentMethod === 'WOMPI_PSE';
        const needsConfig = this.paymentMethod === 'WOMPI_CARD';

        const hasMerchant = !!this.wompiAcceptanceToken && !!this.wompiTermsUrl;
        const hasBanks = !needsBanks || this.wompiBanks.length > 0;
        const hasConfig = !needsConfig || (!!this.wompiBaseUrl && !!this.wompiPublicKey);

        if (hasMerchant && hasBanks && hasConfig) return;

        this.wompiLoading = true;

        this.wompiService.getMerchant().subscribe({
            next: (m) => {
                this.wompiAcceptanceToken = m?.presigned_acceptance?.acceptance_token || '';
                this.wompiTermsUrl = m?.presigned_acceptance?.permalink || '';
                this.wompiMerchantName = m?.name || '';

                if (needsConfig) {
                    this.wompiService.getConfig().subscribe({
                        next: (cfg) => {
                            this.wompiBaseUrl = String(cfg?.base_url || '').trim();
                            this.wompiPublicKey = String(cfg?.public_key || '').trim();

                            if (needsBanks) {
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
                            } else {
                                this.wompiLoading = false;
                            }
                        },
                        error: (err) => {
                            console.error('Error cargando config Wompi:', err);
                            this.wompiBaseUrl = '';
                            this.wompiPublicKey = '';
                            this.wompiLoading = false;
                        }
                    });
                    return;
                }

                if (needsBanks) {
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
                } else {
                    this.wompiLoading = false;
                }
            },
            error: (err) => {
                console.error('Error cargando merchant Wompi:', err);
                this.wompiAcceptanceToken = '';
                this.wompiTermsUrl = '';
                this.wompiMerchantName = '';
                this.wompiBanks = [];
                this.wompiBaseUrl = '';
                this.wompiPublicKey = '';
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
            return;
        }
        if (this.paymentMethod === 'WOMPI_NEQUI') {
            this.submitWompiNequi();
            return;
        }
        if (this.paymentMethod === 'WOMPI_CARD') {
            this.submitWompiCard();
            return;
        }

        this.errorMsg = 'Selecciona un método de pago válido.';
        this.isPlacingOrder = false;
    }

    private submitWompiCard(): void {
        if (!this.wompiAcceptanceToken || !this.wompiTermsUrl || !this.wompiBaseUrl || !this.wompiPublicKey) {
            this.errorMsg = 'No se pudo cargar Wompi. Intenta de nuevo.';
            this.isPlacingOrder = false;
            return;
        }
        if (!this.pseAcceptedTerms) {
            this.errorMsg = 'Debes aceptar los términos de Wompi para continuar.';
            this.isPlacingOrder = false;
            return;
        }

        const holder = String(this.cardHolderName || '').trim();
        if (!holder) {
            this.errorMsg = 'Ingresa el nombre del titular.';
            this.isPlacingOrder = false;
            return;
        }

        const number = String(this.cardNumber || '').replace(/\s|-/g, '');
        if (!this.isValidCardNumber(number)) {
            this.errorMsg = 'Numero de tarjeta inválido.';
            this.isPlacingOrder = false;
            return;
        }

        const mm = String(this.cardExpMonth || '').replace(/\D/g, '');
        const yy = String(this.cardExpYear || '').replace(/\D/g, '');
        const monthN = Number(mm);
        const yearN = Number(yy);
        if (!Number.isFinite(monthN) || monthN < 1 || monthN > 12) {
            this.errorMsg = 'Mes de vencimiento inválido.';
            this.isPlacingOrder = false;
            return;
        }
        if (!Number.isFinite(yearN) || yy.length < 2) {
            this.errorMsg = 'Año de vencimiento inválido.';
            this.isPlacingOrder = false;
            return;
        }

        const cvc = String(this.cardCvc || '').replace(/\D/g, '');
        if (cvc.length < 3 || cvc.length > 4) {
            this.errorMsg = 'CVC inválido.';
            this.isPlacingOrder = false;
            return;
        }

        const inst = Math.max(1, Math.min(36, Math.trunc(Number(this.cardInstallments || 1))));

        this.tokenizeCard({
            number,
            exp_month: mm.padStart(2, '0'),
            exp_year: yy.length === 2 ? `20${yy}` : yy,
            cvc,
            card_holder: holder
        }).then((token) => {
            const payload = {
                ...this.buildOrderData(),
                acceptance_token: this.wompiAcceptanceToken,
                token,
                installments: inst
            };

            this.wompiService.createCardCheckout(payload as any).subscribe({
                next: (res) => {
                    this.isPlacingOrder = false;
                    this.cartService.clearCart();
                    this.router.navigate(['/order-success', res.orderId]);
                },
                error: (err) => {
                    console.error('Error creando checkout tarjeta:', err);
                    const status = err?.status;
                    if ((status === 401 || status === 403) && !this.attemptedRefresh) {
                        this.attemptedRefresh = true;
                        this.authService.refreshUser().subscribe({
                            next: () => this.submitWompiCard(),
                            error: () => {
                                this.isPlacingOrder = false;
                                this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
                            }
                        });
                        return;
                    }
                    const msg = err?.error?.message || err?.error?.error || err?.error?.detail || 'No se pudo iniciar el pago con tarjeta.';
                    this.errorMsg = msg;
                    this.isPlacingOrder = false;
                }
            });
        }).catch((e) => {
            console.error('Error tokenizando tarjeta:', e);
            this.errorMsg = 'No se pudo validar la tarjeta. Revisa los datos e intenta de nuevo.';
            this.isPlacingOrder = false;
        });
    }

    private async tokenizeCard(input: { number: string; exp_month: string; exp_year: string; cvc: string; card_holder: string }): Promise<string> {
        const url = `${this.wompiBaseUrl.replace(/\/+$/, '')}/tokens/cards`;
        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.wompiPublicKey}`
            },
            body: JSON.stringify(input)
        });

        const json = await resp.json().catch(() => ({} as any));
        if (!resp.ok) {
            throw new Error((json as any)?.error?.type || `HTTP ${resp.status}`);
        }

        const token = String((json as any)?.data?.id || (json as any)?.data?.token || (json as any)?.id || '').trim();
        if (!token) throw new Error('Token de tarjeta no recibido');
        return token;
    }

    private isValidCardNumber(num: string): boolean {
        if (!/^[0-9]{12,19}$/.test(num)) return false;
        let sum = 0;
        let shouldDouble = false;
        for (let i = num.length - 1; i >= 0; i--) {
            let digit = Number(num.charAt(i));
            if (shouldDouble) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return sum % 10 === 0;
    }

    private submitWompiNequi(): void {
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
        const phone = String(this.nequiPhone || '').replace(/\D/g, '');
        if (!phone || phone.length < 10) {
            this.errorMsg = 'Ingresa tu número de Nequi.';
            this.isPlacingOrder = false;
            return;
        }

        const payload = {
            ...this.buildOrderData(),
            acceptance_token: this.wompiAcceptanceToken,
            phone_number: phone
        };

        this.wompiService.createNequiCheckout(payload as any).subscribe({
            next: (res) => {
                this.isPlacingOrder = false;
                this.cartService.clearCart();
                // Nequi no requiere redireccion: queda en verificacion.
                this.router.navigate(['/order-success', res.orderId]);
            },
            error: (err) => {
                console.error('Error creando checkout Nequi:', err);
                const status = err?.status;
                if ((status === 401 || status === 403) && !this.attemptedRefresh) {
                    this.attemptedRefresh = true;
                    this.authService.refreshUser().subscribe({
                        next: () => this.submitWompiNequi(),
                        error: () => {
                            this.isPlacingOrder = false;
                            this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
                        }
                    });
                    return;
                }
                const msg = err?.error?.message || err?.error?.error || err?.error?.detail || 'No se pudo iniciar el pago con Nequi.';
                this.errorMsg = msg;
                this.isPlacingOrder = false;
            }
        });
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
                // La orden ya fue creada (y se reservo stock). Evitar duplicados en el carrito.
                this.cartService.clearCart();
                // Redirigir a PSE (Wompi)
                window.location.href = res.asyncPaymentUrl;
            },
            error: (err) => {
                console.error('Error creando checkout PSE:', err);
                const status = err?.status;

                if ((status === 401 || status === 403) && !this.attemptedRefresh) {
                    this.attemptedRefresh = true;
                    this.authService.refreshUser().subscribe({
                        next: () => this.submitWompiPse(),
                        error: () => {
                            this.isPlacingOrder = false;
                            this.router.navigate(['/login'], { queryParams: { returnUrl: '/checkout' } });
                        }
                    });
                    return;
                }
                const msg = err?.error?.message || err?.error?.error || err?.error?.detail || 'No se pudo iniciar el pago con PSE.';
                this.errorMsg = msg;
                this.isPlacingOrder = false;
            }
        });
    }

    private buildOrderData(): CreateOrderDto {
        return {
            total: this.grandTotal,
            shipping_address: this.shippingAddress,
            items: this.cartItems.map((item: CartItem) => ({
                product_id: item.product.id,
                quantity: item.quantity,
                price: Number(item.product.price)
            })),
            envio_prioritario: this.envioPrioritario,
            perfume_lujo: this.perfumeLujo
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
