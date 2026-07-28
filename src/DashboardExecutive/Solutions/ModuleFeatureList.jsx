const ModuleFeatureList = ({ features }) => <ul className="mb-0 ps-3 text-muted">{features.map((feature) => <li key={feature}>{feature}</li>)}</ul>;
export default ModuleFeatureList;
