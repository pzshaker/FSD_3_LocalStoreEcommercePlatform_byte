import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import '@fontsource/outfit/latin-400.css';
import '@fontsource/outfit/latin-500.css';
import '@fontsource/outfit/latin-600.css';
import '@fontsource/fraunces/latin-400.css';
import { api } from './api.js';
import './styles.css';

function Notice({ children, error = false }) { return <p className="notice" role={error ? 'alert' : 'status'}>{children}</p>; }
function Placeholder({ title, children }) {
  return <section className="page"><p className="eyebrow">Development preview</p><h1>{title}</h1><p>{children}</p><Link className="button secondary" to="/">Back to catalog</Link></section>;
}
function CustomerShell() {
  return <><a className="skip" href="#main">Skip to content</a><div className="announcement">Pickup daily, 8:00 a.m. to noon <span>·</span> Pay at pickup</div><header className="header"><Link className="wordmark" to="/">[Bakery name]<small>Brand placeholder</small></Link><nav aria-label="Storefront"><NavLink to="/">Catalog</NavLink><NavLink to="/cart">Cart</NavLink></nav></header><main id="main" tabIndex="-1"><Outlet/></main><footer>Daily pickup · 8:00 a.m. to noon · Pay at pickup</footer></>;
}
function Catalog() {
  const [status, setStatus] = useState('pending');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setStatus('pending');
    api('/customer/session').then(() => { if (active) setStatus('ready'); }).catch(() => { if (active) setStatus('error'); });
    return () => { active = false; };
  }, [retry]);
  return <section className="page catalog"><p className="eyebrow">Development preview</p><h1>Your neighborhood<br/>bakery, online.</h1><p>Browse the menu, choose your pickup, and pay when you arrive.</p><div className="preview"><h2>Catalog coming in Phase 3</h2><p>Product listings will appear here once the catalog API and customer screens are connected. Bakery details remain placeholders.</p><div className="categories" aria-label="Planned product categories">{['Bread', 'Pastries', 'Cakes', 'Drinks'].map(category => <span key={category}>{category}</span>)}</div></div>{status === 'pending' && <Notice>Connecting your browser session…</Notice>}{status === 'ready' && <Notice>Browser session ready.</Notice>}{status === 'error' && <><Notice error>The service is unavailable. Your browser session could not be initialized.</Notice><button className="secondary" onClick={() => setRetry(value => value + 1)}>Try again</button></>}</section>;
}
function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true); setError('');
    try { await api('/owner/session', { method: 'POST', body: { email: form.get('email'), password: form.get('password') } }); navigate('/owner/orders', { replace: true }); }
    catch (failure) { setError(failure.message); }
    finally { setPending(false); }
  }
  return <div className="login-page"><Link className="back" to="/">← Back to storefront</Link><section className="login-panel"><p className="eyebrow">[Bakery name] · Owner area</p><h1>Welcome back.</h1><p>Sign in to manage your products and pickup orders.</p>{location.state?.expired && <Notice>Your session has expired. Sign in again.</Notice>}<form onSubmit={submit} aria-busy={pending}><label htmlFor="email">Email address</label><input id="email" name="email" type="email" autoComplete="username" required maxLength="254"/><label htmlFor="password">Password</label><div className="password"><input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required maxLength="256"/><button type="button" className="secondary" aria-controls="password" aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button></div>{error && <Notice error>{error}</Notice>}<button type="submit" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button></form><p className="fine">Private access for the bakery owner.</p></section></div>;
}
function OwnerShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    api('/owner/session').then(data => { if (active) setState({ owner: data.owner }); }).catch(failure => { if (active) setState({ error: failure }); });
    return () => { active = false; };
  }, [location.pathname, retry]);
  useEffect(() => {
    if (state.owner) document.getElementById('main')?.focus();
  }, [state.owner]);
  async function signOut() {
    setPending(true); setError('');
    try { await api('/owner/session', { method: 'DELETE' }); navigate('/owner/login', { replace: true }); }
    catch (failure) { if (failure.status === 401) navigate('/owner/login', { replace: true }); else setError(failure.message); }
    finally { setPending(false); }
  }
  if (state.loading) return <div className="page"><Notice>Checking owner access…</Notice></div>;
  if (state.error?.status === 401) return <Navigate to="/owner/login" replace state={{ expired: true }}/>;
  if (state.error) return <div className="page"><Notice error>{state.error.message}</Notice><button onClick={() => setRetry(value => value + 1)}>Try again</button></div>;
  return <><a className="skip" href="#main">Skip to content</a><header className="header"><Link className="wordmark" to="/owner/orders">[Bakery name]<small>Owner area</small></Link><nav aria-label="Owner"><NavLink to="/owner/orders">Orders</NavLink><NavLink to="/owner/products">Products</NavLink><button className="secondary" disabled={pending} onClick={signOut}>{pending ? 'Signing out…' : 'Sign out'}</button></nav></header>{error && <Notice error>{error}</Notice>}<main id="main" tabIndex="-1"><Outlet/></main></>;
}
function OwnerPlaceholder({ title, children }) { return <section className="page"><p className="eyebrow">Owner workspace</p><h1>{title}</h1><div className="preview"><h2>Screen implementation follows in Phase 4</h2><p>{children}</p></div></section>; }
function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => { document.querySelector('main')?.focus(); window.scrollTo(0, 0); }, [pathname]);
  return null;
}
function App() {
  return <BrowserRouter><RouteFocus/><Routes><Route element={<CustomerShell/>}><Route index element={<Catalog/>}/><Route path="products/:productId" element={<Placeholder title="Product detail">Product browsing will be connected in Phase 3.</Placeholder>}/><Route path="cart" element={<Placeholder title="Your cart">The session cart API comes in Phase 2, followed by this screen in Phase 3.</Placeholder>}/><Route path="checkout" element={<Placeholder title="Guest checkout">Ordering is not available in this development preview.</Placeholder>}/><Route path="orders/:orderNumber/confirmation" element={<Placeholder title="Order confirmation">Order access will be connected to your browser session in Phase 3.</Placeholder>}/><Route path="*" element={<Placeholder title="Page not found">The page you requested does not exist.</Placeholder>}/></Route><Route path="owner/login" element={<SignIn/>}/><Route path="owner" element={<OwnerShell/>}><Route index element={<Navigate to="orders" replace/>}/><Route path="orders" element={<OwnerPlaceholder title="Pickup orders">The pickup-time queue and fulfillment actions will appear here.</OwnerPlaceholder>}/><Route path="orders/:orderId" element={<OwnerPlaceholder title="Order detail">Order details and status actions will appear here.</OwnerPlaceholder>}/><Route path="products" element={<OwnerPlaceholder title="Products">Create, edit, archive, and restock products here once the product APIs are ready.</OwnerPlaceholder>}/><Route path="products/new" element={<OwnerPlaceholder title="Create product">The product form and photo upload will appear here.</OwnerPlaceholder>}/><Route path="products/:productId/edit" element={<OwnerPlaceholder title="Edit product">The product editor will appear here.</OwnerPlaceholder>}/><Route path="*" element={<section className="page"><h1>Owner page not found</h1><Link className="button" to="/owner/orders">Back to orders</Link></section>}/></Route></Routes></BrowserRouter>;
}
createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
