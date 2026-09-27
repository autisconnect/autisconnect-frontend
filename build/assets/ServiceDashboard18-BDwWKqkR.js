import{i as Y,r as n,j as e,Z as _,K as V,x as q,w as J,D as Q,M as X,y as Z,S as ee,U as T,V as ae,X as te,H as se,I as re,J as ne}from"./vendor-react-D5AOm95y.js";import{M as oe,T as ie,a as ce,P as le,L as H}from"./vendor-maps-H1tDn4eH.js";import{l as de}from"./logonovo-B8fpvhjk.js";import{C as y,A as S,aD as B,B as v,R as $,a as p,at as w,au as d,c as r,aF as o,g as me,T as g,F as l}from"./vendor-ui-DE57BOUR.js";import"./vendor-charts-DjROEP7A.js";const he="/assets/18-C0jQ6IvU.jpg";delete H.Icon.Default.prototype._getIconUrl;H.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"});const a={primary:"#003D7A",secondary:"#DC143C",accent:"#FFD700",light:"#F8F9FA",white:"#FFFFFF",text:"#003D7A",textMuted:"#6C757D",border:"#E9ECEF"},ue=`
    :root {
        --autisconnect-primary: ${a.primary};
        --autisconnect-secondary: ${a.secondary};
        --autisconnect-accent: ${a.accent};
        --autisconnect-light: ${a.light};
    }

    .autisconnect-navbar {
        background: linear-gradient(135deg, ${a.primary} 0%, #004a96 100%) !important;
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.15);
        border-bottom: 3px solid ${a.accent};
    }

    .autisconnect-navbar .navbar-brand {
        font-weight: 700;
        color: ${a.white} !important;
    }

    .autisconnect-navbar .btn-outline-light {
        border-color: ${a.white};
        color: ${a.white};
    }

    .autisconnect-navbar .btn-outline-light:hover {
        background-color: ${a.accent};
        border-color: ${a.accent};
        color: ${a.primary};
    }

    .autisconnect-hero {
        background-size: cover;
        background-position: center;
        position: relative;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 61, 122, 0.1);
    }

    .autisconnect-hero-overlay {
        background: linear-gradient(135deg, rgba(0, 61, 122, 0.85) 0%, rgba(220, 20, 60, 0.75) 100%);
        backdrop-filter: blur(4px);
        border-radius: 12px;
    }

    .autisconnect-hero h1 {
        color: ${a.white};
        font-weight: 800;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        letter-spacing: -0.5px;
    }

    .autisconnect-hero p {
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.1rem;
        line-height: 1.6;
    }

    .autisconnect-card {
        border: none;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.08);
        transition: all 0.3s ease;
        overflow: hidden;
    }

    .autisconnect-card:hover {
        box-shadow: 0 4px 16px rgba(0, 61, 122, 0.15);
        transform: translateY(-2px);
    }

    .autisconnect-card-header {
        background: linear-gradient(135deg, ${a.primary} 0%, #004a96 100%);
        color: ${a.white};
        border: none;
        font-weight: 600;
        padding: 1rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .autisconnect-card-header svg {
        color: ${a.accent};
    }

    .autisconnect-nav-pills .nav-link {
        color: ${a.text};
        border-radius: 8px;
        transition: all 0.3s ease;
        font-weight: 500;
        margin-bottom: 0.5rem;
    }

    .autisconnect-nav-pills .nav-link:hover {
        background-color: ${a.light};
        color: ${a.primary};
    }

    .autisconnect-nav-pills .nav-link.active {
        background: linear-gradient(135deg, ${a.primary} 0%, #004a96 100%);
        color: ${a.white};
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.2);
    }

    .autisconnect-btn-primary {
        background: linear-gradient(135deg, ${a.primary} 0%, #004a96 100%);
        border: none;
        color: ${a.white};
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
        padding: 0.75rem 1.5rem;
    }

    .autisconnect-btn-primary:hover {
        background: linear-gradient(135deg, #004a96 0%, ${a.primary} 100%);
        color: ${a.white};
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 61, 122, 0.3);
    }

    .autisconnect-btn-secondary {
        background-color: ${a.secondary};
        border: none;
        color: ${a.white};
        font-weight: 600;
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .autisconnect-btn-secondary:hover {
        background-color: #b30a2c;
        color: ${a.white};
        transform: translateY(-2px);
    }

    .autisconnect-badge {
        background-color: ${a.accent};
        color: ${a.primary};
        font-weight: 600;
        border-radius: 6px;
        padding: 0.5rem 0.75rem;
    }

    .autisconnect-badge-secondary {
        background-color: ${a.secondary};
        color: ${a.white};
    }

    .autisconnect-list-group-item {
        border: 1px solid ${a.border};
        border-radius: 8px;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }

    .autisconnect-list-group-item:hover {
        background-color: ${a.light};
        border-color: ${a.primary};
    }

    .autisconnect-feedback-item {
        border-left: 4px solid ${a.accent};
        padding: 1rem;
        border-radius: 8px;
        background-color: ${a.light};
        margin-bottom: 1rem;
    }

    .autisconnect-rating-avg {
        color: ${a.primary};
        font-weight: 800;
    }

    .autisconnect-modal-header {
        background: linear-gradient(135deg, ${a.primary} 0%, #004a96 100%);
        color: ${a.white};
        border: none;
    }

    .autisconnect-modal-header .btn-close {
        filter: brightness(0) invert(1);
    }

    .autisconnect-form-label {
        color: ${a.primary};
        font-weight: 600;
    }

    .autisconnect-form-control {
        border: 2px solid ${a.border};
        border-radius: 8px;
        transition: all 0.3s ease;
    }

    .autisconnect-form-control:focus {
        border-color: ${a.primary};
        box-shadow: 0 0 0 0.2rem rgba(0, 61, 122, 0.15);
    }

    .autisconnect-alert-success {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        border-radius: 8px;
    }

    .autisconnect-alert-danger {
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        border-radius: 8px;
    }

    .autisconnect-link {
        color: ${a.secondary};
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
    }

    .autisconnect-link:hover {
        color: #b30a2c;
        text-decoration: underline;
    }

    .autisconnect-divider {
        border-top: 2px solid ${a.accent};
        margin: 1.5rem 0;
    }

    .autisconnect-tab-content {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .autisconnect-map-container {
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0, 61, 122, 0.1);
    }
`,E=({rating:x})=>{const c=[],t=Math.floor(x),m=x%1>=.5,b=5-t-(m?1:0);for(let i=0;i<t;i++)c.push(e.jsx(se,{style:{color:a.accent}},`full-${i}`));m&&c.push(e.jsx(re,{style:{color:a.accent}},"half"));for(let i=0;i<b;i++)c.push(e.jsx(ne,{style:{color:a.textMuted}},`empty-${i}`));return e.jsx("span",{className:"ms-1",children:c})},pe={18:{id:18,mainPhoto:he,name:"Acolher Espaço Terapêutico",segment:"Terapeuta Ocupacional",description:"Um ambiente cuidadosamente projetado para promover o desenvolvimento, a autonomia e o bem-estar de indivíduos com TEA",hours:"Seg-Sex: 07:00-20:00",menuServices:[{id:1,name:"Café da Manhã Inclusivo",description:"Opções variadas com texturas e sabores suaves."},{id:2,name:"Almoço Sensorial",description:"Pratos balanceados com apresentação cuidadosa."}],certificates:[{id:1,name:"Certificado de Inclusão Autisconnect 2024"},{id:2,name:"Selo Ambiente Amigo do Autista"}],address:"Rua Melo Peixoto, 288, Sala 05, Ceorga, Garanhuns, PE",coordinates:[-8.89343,-36.495928],contact:{phone:"(87) 99971-0062",whatsapp:"(87) 99971-0062",socialMedia:{instagram:"https://instagram.com/acolher.espaco_terapeutico"}},feedbacks:[{id:1,rating:5,comment:"Excelente atendimento, ambiente muito calmo e adaptado. Meu filho adorou!",date:"2025-06-10"},{id:2,rating:4,comment:"Gostamos muito, apenas o som ambiente estava um pouco alto no início.",date:"2025-06-08"},{id:3,rating:4.5,comment:"Recomendo!",date:"2025-05-28"}],reservations:[{id:1,date:"2025-06-15",time:"09:00",status:"Confirmada"},{id:2,date:"2025-06-20",time:"14:00",status:"Pendente"},{id:3,date:"2025-06-22",time:"11:00",status:"Cancelada"}]}};function ye(){const{id:x}=Y(),c=x||"18",[t,m]=n.useState(null),[b,i]=n.useState(null),[z,P]=n.useState("visao-geral"),[N,L]=n.useState(null),[U,C]=n.useState(!1),[h,F]=n.useState(""),[u,I]=n.useState(""),[f,M]=n.useState(null),[A,k]=n.useState(null);n.useEffect(()=>{const s=pe[c];s?m(s):i("Serviço não encontrado.")},[c]),n.useEffect(()=>{N&&t?.coordinates&&N.flyTo(t.coordinates,15)},[t?.coordinates,N]);const W=()=>{window.close()},G=()=>{F(""),I(""),M(null),k(null),C(!0)},D=()=>{C(!1)},K=()=>{if(!h||!u){k("Por favor, selecione a data e a hora desejadas.");return}console.log(`Solicitando reserva para ${h} às ${u}`);const s={id:Date.now(),date:h,time:u,status:"Pendente"};m(j=>({...j,reservations:[...j.reservations||[],s]})),M(`Solicitação de reserva para ${h} às ${u} enviada! Aguarde a confirmação.`),k(null)},R=n.useMemo(()=>!t?.feedbacks||t.feedbacks.length===0?0:(t.feedbacks.reduce((j,O)=>j+O.rating,0)/t.feedbacks.length).toFixed(1),[t?.feedbacks]);return b?e.jsx(y,{className:"d-flex justify-content-center align-items-center",style:{height:"100vh"},children:e.jsx(S,{className:"autisconnect-alert-danger",children:b})}):t?e.jsxs("div",{className:"app",style:{backgroundColor:a.light,minHeight:"100vh"},children:[e.jsx("style",{children:ue}),e.jsx(B,{expand:"lg",sticky:"top",className:"autisconnect-navbar mb-4",children:e.jsxs(y,{fluid:!0,children:[e.jsx(B.Brand,{href:"/",className:"fw-bold",children:e.jsx("img",{src:de,alt:"Autisconnect Logo",className:"d-inline-block align-top",style:{height:"40px",marginRight:"10px"}})}),e.jsx("span",{className:"navbar-text mx-auto d-none d-lg-block",style:{color:a.white,fontWeight:600},children:t.name}),e.jsxs(v,{className:"autisconnect-btn-primary d-flex align-items-center gap-2",size:"sm",onClick:W,children:[e.jsx(_,{})," Voltar"]})]})}),e.jsxs(y,{fluid:!0,className:"px-3 px-md-4 pb-5",children:[e.jsx($,{className:"autisconnect-hero mb-4 align-items-center",style:{backgroundImage:`url(${t.mainPhoto})`},children:e.jsxs(p,{className:"autisconnect-hero-overlay p-4 p-md-5 text-white",children:[e.jsx("h1",{className:"display-4 fw-bold mb-3",children:t.name}),e.jsx("p",{className:"lead mb-2",style:{fontSize:"1.3rem",fontWeight:600},children:t.segment}),e.jsx("p",{className:"mb-0",style:{fontSize:"1.05rem",lineHeight:"1.6"},children:t.description||"Descrição do serviço não disponível."})]})}),e.jsx(w.Container,{id:"service-dashboard-tabs",activeKey:z,onSelect:s=>P(s),children:e.jsxs($,{className:"g-4",children:[e.jsx(p,{lg:3,className:"mb-3 mb-lg-0",children:e.jsxs(d,{variant:"pills",className:"flex-column autisconnect-nav-pills p-4 bg-white rounded-3",style:{boxShadow:"0 2px 8px rgba(0, 61, 122, 0.08)"},children:[e.jsx(d.Item,{className:"mb-2",children:e.jsxs(d.Link,{eventKey:"visao-geral",className:"d-flex align-items-center gap-2",children:[e.jsx(V,{style:{color:a.accent}})," Visão Geral"]})}),e.jsx(d.Item,{className:"mb-3",children:e.jsxs(d.Link,{eventKey:"feedback",className:"d-flex align-items-center gap-2",children:[e.jsx(q,{style:{color:a.accent}})," Avaliações"]})}),e.jsx("div",{className:"autisconnect-divider"}),e.jsx(d.Item,{children:e.jsxs(v,{className:"autisconnect-btn-primary w-100 d-flex align-items-center justify-content-center gap-2",onClick:G,children:[e.jsx(J,{})," Solicitar Atendimento"]})})]})}),e.jsx(p,{lg:9,children:e.jsxs(w.Content,{className:"autisconnect-tab-content",children:[e.jsx(w.Pane,{eventKey:"visao-geral",children:e.jsxs($,{className:"g-4",children:[e.jsxs(p,{md:7,children:[e.jsxs(r,{className:"autisconnect-card mb-4",children:[e.jsxs(r.Header,{className:"autisconnect-card-header",children:[e.jsx(Q,{})," Horário de Funcionamento"]}),e.jsx(r.Body,{style:{padding:"1.5rem"},children:e.jsx("p",{style:{fontSize:"1.1rem",color:a.primary,fontWeight:600,margin:0},children:t.hours})})]}),e.jsxs(r,{className:"autisconnect-card mb-4",children:[e.jsxs(r.Header,{className:"autisconnect-card-header",children:[e.jsx(X,{})," Serviços Oferecidos"]}),e.jsx(o,{variant:"flush",children:t.menuServices?.length>0?t.menuServices.map(s=>e.jsx(o.Item,{className:"autisconnect-list-group-item",style:{border:"none",padding:"1rem"},children:e.jsxs("div",{className:"d-flex justify-content-between align-items-start",children:[e.jsxs("div",{className:"flex-grow-1",children:[e.jsx("div",{className:"fw-bold",style:{color:a.primary,fontSize:"1.05rem",marginBottom:"0.25rem"},children:s.name}),e.jsx("p",{style:{color:a.textMuted,margin:0,fontSize:"0.95rem"},children:s.description})]}),s.price&&e.jsx(me,{className:"autisconnect-badge ms-2",children:s.price})]})},s.id)):e.jsx(o.Item,{style:{padding:"1rem",color:a.textMuted},children:"Nenhum serviço cadastrado."})})]}),e.jsxs(r,{className:"autisconnect-card",children:[e.jsxs(r.Header,{className:"autisconnect-card-header",children:[e.jsx(Z,{})," Certificações e Selos"]}),e.jsx(o,{variant:"flush",children:t.certificates?.length>0?t.certificates.map(s=>e.jsxs(o.Item,{style:{padding:"1rem",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx("span",{style:{color:a.accent,fontSize:"1.2rem"},children:"✓"}),e.jsx("span",{style:{color:a.primary,fontWeight:500},children:s.name})]},s.id)):e.jsx(o.Item,{style:{padding:"1rem",color:a.textMuted},children:"Nenhum certificado cadastrado."})})]})]}),e.jsxs(p,{md:5,children:[e.jsxs(r,{className:"autisconnect-card mb-4",style:{height:"350px"},children:[e.jsxs(r.Header,{className:"autisconnect-card-header",children:[e.jsx(ee,{})," Localização"]}),e.jsx("div",{className:"autisconnect-map-container",style:{height:"100%",width:"100%"},children:e.jsxs(oe,{center:t.coordinates||[-8.047562,-34.877],zoom:15,style:{height:"100%",width:"100%"},whenCreated:L,children:[e.jsx(ie,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}),t.coordinates&&e.jsx(ce,{position:t.coordinates,children:e.jsx(le,{children:t.name})})]})})]}),e.jsxs(r,{className:"autisconnect-card",children:[e.jsxs(r.Header,{className:"autisconnect-card-header",children:[e.jsx(T,{})," Contato"]}),e.jsxs(o,{variant:"flush",children:[e.jsxs(o.Item,{style:{padding:"1rem",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx(T,{style:{color:a.primary}}),e.jsx("span",{style:{color:a.text,fontWeight:500},children:t.contact?.phone||"Não informado"})]}),t.contact?.whatsapp&&e.jsxs(o.Item,{style:{padding:"1rem",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx(ae,{style:{color:"#25D366"}}),e.jsx("a",{href:`https://wa.me/${t.contact.whatsapp.replace(/\D/g,"")}`,target:"_blank",rel:"noopener noreferrer",className:"autisconnect-link",children:t.contact.whatsapp})]}),t.contact?.socialMedia?.instagram&&e.jsxs(o.Item,{style:{padding:"1rem",display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx(te,{style:{color:"#E4405F"}}),e.jsx("a",{href:t.contact.socialMedia.instagram,target:"_blank",rel:"noopener noreferrer",className:"autisconnect-link",children:"Instagram"})]})]})]})]})]})}),e.jsxs(w.Pane,{eventKey:"feedback",children:[e.jsx("h3",{className:"mb-4",style:{color:a.primary,fontWeight:700},children:"Avaliações do Estabelecimento"}),e.jsxs(r,{className:"autisconnect-card mb-4",children:[e.jsx(r.Header,{className:"autisconnect-card-header",children:"Avaliação Média"}),e.jsxs(r.Body,{style:{padding:"2rem",textAlign:"center"},children:[e.jsxs("div",{style:{marginBottom:"1rem"},children:[e.jsx("span",{className:"autisconnect-rating-avg",style:{fontSize:"3rem",marginRight:"1rem"},children:R}),e.jsx(E,{rating:parseFloat(R)})]}),e.jsxs("p",{style:{color:a.textMuted,margin:0,fontSize:"0.95rem"},children:["Baseado em ",t.feedbacks?.length||0," avaliações"]})]})]}),e.jsxs(r,{className:"autisconnect-card",children:[e.jsx(r.Header,{className:"autisconnect-card-header",children:"Comentários de Usuários"}),e.jsx(r.Body,{style:{padding:"1.5rem"},children:t.feedbacks&&t.feedbacks.length>0?t.feedbacks.map(s=>e.jsxs("div",{className:"autisconnect-feedback-item",children:[e.jsxs("div",{className:"d-flex w-100 justify-content-between align-items-center mb-2",children:[e.jsx(E,{rating:s.rating}),e.jsx("small",{style:{color:a.textMuted,fontWeight:500},children:new Date(s.date+"T00:00:00").toLocaleDateString("pt-BR")})]}),e.jsx("p",{style:{color:a.text,margin:0,lineHeight:1.6},children:s.comment})]},s.id)):e.jsx("p",{style:{color:a.textMuted,textAlign:"center",padding:"2rem 0"},children:"Nenhum feedback recebido ainda."})})]})]})]})})]})})]}),e.jsxs(g,{show:U,onHide:D,centered:!0,children:[e.jsx(g.Header,{className:"autisconnect-modal-header",children:e.jsx(g.Title,{style:{fontWeight:700},children:"Solicitar Atendimento"})}),e.jsxs(g.Body,{style:{padding:"2rem"},children:[f&&e.jsx(S,{className:"autisconnect-alert-success",style:{marginBottom:"1rem"},children:f}),A&&e.jsx(S,{className:"autisconnect-alert-danger",style:{marginBottom:"1rem"},children:A}),!f&&e.jsxs(l,{children:[e.jsxs(l.Group,{className:"mb-3",controlId:"reservationDate",children:[e.jsx(l.Label,{className:"autisconnect-form-label",children:"Data Desejada"}),e.jsx(l.Control,{type:"date",className:"autisconnect-form-control",value:h,onChange:s=>F(s.target.value),min:new Date().toISOString().split("T")[0],required:!0})]}),e.jsxs(l.Group,{className:"mb-3",controlId:"reservationTime",children:[e.jsx(l.Label,{className:"autisconnect-form-label",children:"Hora Desejada"}),e.jsx(l.Control,{type:"time",className:"autisconnect-form-control",value:u,onChange:s=>I(s.target.value),required:!0})]}),e.jsx("p",{style:{color:a.textMuted,fontSize:"0.9rem",marginBottom:0},children:"Sua solicitação será enviada ao estabelecimento para confirmação."})]})]}),e.jsxs(g.Footer,{style:{padding:"1.5rem",borderTop:`1px solid ${a.border}`},children:[e.jsx(v,{className:"autisconnect-btn-secondary",onClick:D,children:"Fechar"}),!f&&e.jsx(v,{className:"autisconnect-btn-primary",onClick:K,children:"Enviar Solicitação"})]})]})]}):e.jsx(y,{className:"d-flex justify-content-center align-items-center",style:{height:"100vh"},children:e.jsx("div",{style:{color:a.primary,fontWeight:600},children:"Carregando informações do serviço..."})})}export{ye as default};
