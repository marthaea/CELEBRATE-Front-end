import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { usePlan } from "../../../src/plan.jsx";
import { Art, Drum, ErrorNote, Loading, ServiceCard } from "../components.jsx";

export default function Home() {
  const plan = usePlan();
  const { hash } = useLocation();
  const meta = useLoad(api.meta, []);
  const offers = useLoad(api.offers, []);

  useEffect(() => {
    if (hash && offers.data) document.querySelector(hash)?.scrollIntoView();
  }, [hash, offers.data]);

  return (
    <>
      <section className="hero">
        <div className="hero-panel hero-left" aria-hidden="true" />
        <div className="hero-panel hero-right" aria-hidden="true"><Drum className="hero-drum" /></div>
        <div className="hero-centre">
          <h1 className="wordmark large">CELEBRATE</h1>
          <a href="#intro" className="link-caps on-dark">Enter</a>
        </div>
      </section>

      <section className="intro" id="intro">
        <p className="caps">Tukusanyukidde · Welcome{plan.name ? `, ${plan.name}` : ""}</p>
        <p className="lead">Every event service. One platform. One grand total. Choose your venue, tents, food, sound and more from trusted vendors across Uganda, and see the full cost before you pay.</p>
        <Link to="/services" className="link-caps">Plan my event</Link>
      </section>

      <section className="occasions">
        <h2 className="caps">What are we celebrating?</h2>
        <ErrorNote>{meta.error}</ErrorNote>
        <div className="occasion-row" role="group" aria-label="Event type">
          {meta.data?.eventTypes.map((type) => (
            <button key={type} className={plan.event.type === type ? "on" : ""} aria-pressed={plan.event.type === type} onClick={() => plan.setEvent({ type })}>
              {type}
            </button>
          ))}
        </div>
      </section>

      <section className="block">
        <div className="block-head">
          <h2 className="caps">Services</h2>
          <Link to="/services" className="link-caps">All services</Link>
        </div>
        {meta.loading && <Loading />}
        <div className="grid four">
          {meta.data?.categories.map((category, index) => (
            <Link key={category.id} to={`/services/${category.id}`} className="piece">
              <div className="piece-art tall"><Art category={category.id} seed={index * 3} label={category.title} /></div>
              <h3>{category.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      <section className="block" id="offers">
        <div className="block-head">
          <h2 className="caps">Offers this week</h2>
          <Link to="/services?filter=offers" className="link-caps">All offers</Link>
        </div>
        <ErrorNote>{offers.error}</ErrorNote>
        {offers.loading && <Loading />}
        <div className="grid four">
          {offers.data?.map((service, index) => <ServiceCard key={service.id} service={service} index={index} />)}
        </div>
      </section>

      <section className="feature">
        <Art category="tents" seed={4} className="feature-art" label="A draped tent set up for a kwanjula" />
        <div className="feature-text">
          <h2 className="caps">One number. Every detail.</h2>
          <p>Tell us the date, the district and how many guests. We match tents and chairs to your numbers, add labour, transport and our 3% fee, and show you a single grand total.</p>
          <ol className="steps">
            <li><span className="caps">01</span>Choose your services</li>
            <li><span className="caps">02</span>Tell us the details</li>
            <li><span className="caps">03</span>See your grand total</li>
            <li><span className="caps">04</span>Pay your way</li>
          </ol>
          <Link to="/plan" className="link-caps">See my plan</Link>
        </div>
      </section>

      <section className="intro narrow">
        <h2 className="caps">For vendors</h2>
        <p className="lead">Tent hire, caterers, venues, MCs and photographers: bring your business to the families planning their next celebration.</p>
        <Link to="/vendors" className="link-caps">List my business</Link>
      </section>
    </>
  );
}
