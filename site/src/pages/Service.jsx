import { Link, useNavigate, useParams } from "react-router-dom";
import { api, useLoad } from "../../../src/api.js";
import { discountPercent, formatDate, money } from "../../../src/format.js";
import { usePlan } from "../../../src/plan.jsx";
import { Art, ErrorNote, Loading } from "../components.jsx";

export default function Service() {
  const { id } = useParams();
  const navigate = useNavigate();
  const plan = usePlan();
  const meta = useLoad(api.meta, []);
  const { data: service, error, loading } = useLoad(() => api.service(id), [id]);
  const added = plan.items.includes(id);
  const category = meta.data?.categories.find((c) => c.id === service?.category);

  if (error) return <div className="page"><ErrorNote>{error}</ErrorNote><Link to="/services" className="link-caps">All services</Link></div>;
  if (loading || !service) return <div className="page"><Loading /></div>;

  const off = discountPercent(service);
  return (
    <article className="product">
      <div className="product-art">
        <Art category={service.category} seed={service.name.length} label={service.photoCaption} />
        <p className="product-caption">{service.photoCaption} · 1 of {service.photos} photos</p>
      </div>
      <div className="product-info">
        <Link to={`/services/${service.category}`} className="link-quiet">← {category?.title ?? "Services"}</Link>
        <p className="caps">{category?.title}</p>
        <h1>{service.name}</h1>
        <p className="quiet">by {service.vendor}{service.verified ? " · Verified vendor" : ""} · Rated {service.rating} of 5 · {service.reviews} reviews</p>

        <p className="product-price">
          {money(service.price)} <span className="quiet">per {service.unit}</span>
          {service.wasPrice && <s className="quiet">{service.wasPrice.toLocaleString("en-US")}</s>}
          {off > 0 && <span className="tag inline">{off}% off</span>}
        </p>

        <button className={`button ${added ? "outline" : ""}`} onClick={() => (added ? plan.removeItem(id) : plan.addItem(id))}>
          {added ? "Remove from my plan" : "Add to my plan"}
        </button>
        {added && <button className="button" onClick={() => navigate("/plan")}>View my plan</button>}
        <p className="quiet centre">Free on {formatDate(plan.event.date)} · {service.district}</p>

        <section className="detail">
          <h2 className="caps">What is included</h2>
          <ul>{service.included.map((line) => <li key={line}>{line}</li>)}</ul>
        </section>

        {service.review && (
          <section className="detail">
            <h2 className="caps">Sample review</h2>
            <blockquote>“{service.review.text}”</blockquote>
            <p className="quiet">{service.review.by}</p>
          </section>
        )}
      </div>
    </article>
  );
}
