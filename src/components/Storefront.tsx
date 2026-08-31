import {
  ArrowLeft,
  ArrowRight,
  Bag,
  CaretRight,
  Check,
  Fingerprint,
  Headphones,
  Info,
  Package,
  ShieldCheck,
  ShoppingBagOpen,
} from '@phosphor-icons/react'
import type { HackathonView } from '../app/types'

const products = [
  {
    id: 'NST-BAG-001',
    name: 'Navy Commuter Bag',
    price: '$179',
    note: 'Weatherproof recycled twill',
    tone: 'navy',
    icon: Bag,
  },
  {
    id: 'NST-MUG-004',
    name: 'Ivory Smart Travel Mug',
    price: '$64',
    note: 'Ceramic-lined thermal steel',
    tone: 'ivory',
    icon: Package,
  },
  {
    id: 'NST-AUD-009',
    name: 'Forest Wireless Headphones',
    price: '$129',
    note: '40-hour listening time',
    tone: 'forest',
    icon: Headphones,
  },
] as const

function StoreHeader({ state }: { state: number }) {
  return (
    <header className="store-header">
      <a className="store-wordmark" href={`/store?state=${state}`}><span>N</span><strong>Northstar Supply</strong></a>
      <nav aria-label="Store navigation"><a href={`/store?state=${state}`}>Field goods</a><a href={`/store/checkout-help?state=${state}`}>Help</a></nav>
      <a className="control-plane-link" href={`/control-plane?state=${state}`}><ArrowLeft aria-hidden="true" />GlassWake control plane</a>
    </header>
  )
}

function ProductVisual({ tone, icon: Icon, large = false }: { tone: string; icon: typeof Bag; large?: boolean }) {
  return (
    <div className={`product-visual product-${tone}${large ? ' product-visual-large' : ''}`} aria-hidden="true">
      <div className="visual-grid" />
      <div className="product-object"><Icon weight="duotone" /></div>
      <span className="visual-edition">NORTHSTAR / FIELD SERIES</span>
    </div>
  )
}

function PolicyCallout({ days, surfaceId }: { days: number; surfaceId: string }) {
  return (
    <aside className={`store-policy${days === 14 ? ' policy-current' : ' policy-stale-fixture'}`} aria-label="Returns policy">
      <div className="policy-icon"><ShieldCheck weight="duotone" aria-hidden="true" /></div>
      <div><span>Returns policy</span><strong>Returns accepted within {days} days</strong><p>Unused items in original condition. A prepaid return label is included.</p></div>
      <div className="surface-identity"><Fingerprint aria-hidden="true" /><span><small>Inspectable surface</small><code>{surfaceId}</code></span></div>
    </aside>
  )
}

function ProductGrid({ view }: { view: HackathonView }) {
  return (
    <main className="store-main">
      <section className="store-intro">
        <p className="store-kicker">Equipment for the moving day</p>
        <h1>Carry less noise.<br />Keep what matters.</h1>
        <p>Considered travel goods made for weekday crossings, overnight trains, and the space between.</p>
      </section>
      <section className="product-grid" aria-label="Northstar field goods">
        {products.map((product, index) => {
          const Icon = product.icon
          return (
            <article className={`product-card product-card-${index + 1}`} key={product.id}>
              <a href={product.id === 'NST-BAG-001' ? `/store/product/${product.id}?state=${view.index}` : '#'} aria-label={`View ${product.name}`}>
                <ProductVisual tone={product.tone} icon={Icon} />
                <div className="product-copy"><div><span>{product.note}</span><h2>{product.name}</h2></div><strong>{product.price}</strong></div>
                <p className="product-link">View field notes <ArrowRight aria-hidden="true" /></p>
              </a>
            </article>
          )
        })}
      </section>
      <section className="store-principles">
        <div><span>01</span><strong>Built for repeat routes</strong><p>Repairable components and materials selected for daily use.</p></div>
        <div><span>02</span><strong>Quiet by design</strong><p>Fewer compartments, deliberate access, no unnecessary hardware.</p></div>
        <div><span>03</span><strong>Clear commitments</strong><p>Product policies written in plain language at the point of decision.</p></div>
      </section>
    </main>
  )
}

function ProductDetail({ view }: { view: HackathonView }) {
  return (
    <main className="product-detail-page">
      <div className="store-breadcrumbs"><a href={`/store?state=${view.index}`}>Field goods</a><CaretRight aria-hidden="true" /><span>Navy Commuter Bag</span></div>
      <section className="product-detail-grid">
        <ProductVisual tone="navy" icon={Bag} large />
        <div className="product-detail-copy">
          <p className="store-kicker">Northstar Field Series · 01</p>
          <h1>Navy Commuter Bag</h1>
          <p className="product-price">$179</p>
          <p className="product-lede">A clean 18-liter carry for weekday movement, cut from weatherproof recycled twill with a suspended laptop sleeve and low-profile hardware.</p>
          <ul className="product-facts">
            <li><Check aria-hidden="true" />16-inch suspended laptop sleeve</li>
            <li><Check aria-hidden="true" />Weather-sealed top zip</li>
            <li><Check aria-hidden="true" />Padded recycled-nylon strap</li>
          </ul>
          <button type="button" className="store-cta">Add to field kit <ShoppingBagOpen aria-hidden="true" /></button>
          <p className="fixture-disclosure"><Info aria-hidden="true" />Fixture storefront · no payment or order is created.</p>
        </div>
      </section>
      <PolicyCallout days={view.policy.storefrontDays} surfaceId="surface://store/product/NST-BAG-001" />
      <section className="product-story"><span>18 L</span><div><p className="store-kicker">One volume, carefully divided</p><h2>Room for the day.<br />Nothing to hunt for.</h2><p>The structured base keeps the bag upright while two internal slip pockets separate cables and smaller essentials.</p></div></section>
    </main>
  )
}

function CheckoutHelp({ view }: { view: HackathonView }) {
  return (
    <main className="checkout-help-page">
      <div className="help-heading"><p className="store-kicker">Checkout help</p><h1>Before you place an order</h1><p>Clear answers to the questions that matter at checkout.</p></div>
      <div className="help-layout">
        <section className="help-topics" aria-label="Help topics">
          <article><span>01</span><div><h2>Delivery timing</h2><p>In-stock field goods leave our workshop within two business days.</p></div></article>
          <article><span>02</span><div><h2>Payment</h2><p>This demo surface does not collect payment or create an order.</p></div></article>
          <article><span>03</span><div><h2>Returns</h2><p>The policy at right is the copy monitored by GlassWake.</p></div></article>
        </section>
        <div>
          <PolicyCallout days={view.policy.storefrontDays} surfaceId="surface://store/checkout-help" />
          <a className="back-to-product" href={`/store/product/NST-BAG-001?state=${view.index}`}>View Navy Commuter Bag <ArrowRight aria-hidden="true" /></a>
        </div>
      </div>
    </main>
  )
}

export function NorthstarStore({ path, snapshot }: { path: string; snapshot: HackathonView }) {
  return (
    <div className="northstar-store">
      <StoreHeader state={snapshot.index} />
      {path === '/store/product/NST-BAG-001' ? <ProductDetail view={snapshot} /> : path === '/store/checkout-help' ? <CheckoutHelp view={snapshot} /> : <ProductGrid view={snapshot} />}
      <footer className="store-footer"><div className="store-wordmark"><span>N</span><strong>Northstar Supply</strong></div><p>Fixture commerce surface for GlassWake Route B.</p><Bag aria-hidden="true" /></footer>
    </div>
  )
}
