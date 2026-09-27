import{u as Y,r as o,j as e,C as y,a as $,B as v}from"./index-aQH_LKmj.js";import{M as _,T as q,a as V,P as Q,L as z}from"./leaflet-CO13SWw1.js";import{v as J,n as X,d as Z,c as ee,i as ae,o as te,e as re,p as se,q as T,r as oe,t as ne,k as ie,l as ce,m as le}from"./index-_i-KBlii.js";import{l as de}from"./logonovo-B8fpvhjk.js";import{N as B}from"./Navbar-Di9bIKI3.js";import{R as S}from"./Row-ChdX26vV.js";import{C as u}from"./Col-Jz5N1kj-.js";import{T as w}from"./Tab-DgZxFMLe.js";import{N as d}from"./Nav-Dw9Dlk_a.js";import{C as s}from"./Card-Diqtqrch.js";import{L as n}from"./ListGroup-BqZ-Sclb.js";import{B as me}from"./Badge-DBwCimg9.js";import{M as g}from"./Modal-Ch0uAWKw.js";import{F as l}from"./Form-7abBRlcj.js";import"./SelectableContext-C7VH_9uF.js";import"./NavbarContext-CXlEW30A.js";import"./Offcanvas-DVC6fkci.js";import"./AbstractModalHeader-BP6NqT8z.js";import"./SSRProvider-BzLwBz3o.js";import"./Nav-B8gISCpN.js";import"./NavContext-DCAzEYtH.js";import"./CardHeaderContext-lIU1-5Rq.js";import"./warning-DMHi858d.js";import"./useWillUnmount-sZKpvrNH.js";import"./ElementChildren-BM5gxZ9_.js";const he="/assets/18-C0jQ6IvU.jpg";delete z.Icon.Default.prototype._getIconUrl;z.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"});const a={primary:"#003D7A",secondary:"#DC143C",accent:"#FFD700",light:"#F8F9FA",white:"#FFFFFF",text:"#003D7A",textMuted:"#6C757D",border:"#E9ECEF"},pe=`
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
`,E=({rating:x})=>{const c=[],t=Math.floor(x),m=x%1>=.5,b=5-t-(m?1:0);for(let i=0;i<t;i++)c.push(e.jsx(ie,{style:{color:a.accent}},`full-${i}`));m&&c.push(e.jsx(ce,{style:{color:a.accent}},"half"));for(let i=0;i<b;i++)c.push(e.jsx(le,{style:{color:a.textMuted}},`empty-${i}`));return e.jsx("span",{className:"ms-1",children:c})},ue={18:{id:18,mainPhoto:he,name:"Acolher Espaço Terapêutico",segment:"Terapeuta Ocupacional",description:"Um ambiente cuidadosamente projetado para promover o desenvolvimento, a autonomia e o bem-estar de indivíduos com TEA",hours:"Seg-Sex: 07:00-20:00",menuServices:[{id:1,name:"Café da Manhã Inclusivo",description:"Opções variadas com texturas e sabores suaves."},{id:2,name:"Almoço Sensorial",description:"Pratos balanceados com apresentação cuidadosa."}],certificates:[{id:1,name:"Certificado de Inclusão Autisconnect 2024"},{id:2,name:"Selo Ambiente Amigo do Autista"}],address:"Rua Melo Peixoto, 288, Sala 05, Ceorga, Garanhuns, PE",coordinates:[-8.89343,-36.495928],contact:{phone:"(87) 99971-0062",whatsapp:"(87) 99971-0062",socialMedia:{instagram:"https://instagram.com/acolher.espaco_terapeutico"}},feedbacks:[{id:1,rating:5,comment:"Excelente atendimento, ambiente muito calmo e adaptado. Meu filho adorou!",date:"2025-06-10"},{id:2,rating:4,comment:"Gostamos muito, apenas o som ambiente estava um pouco alto no início.",date:"2025-06-08"},{id:3,rating:4.5,comment:"Recomendo!",date:"2025-05-28"}],reservations:[{id:1,date:"2025-06-15",time:"09:00",status:"Confirmada"},{id:2,date:"2025-06-20",time:"14:00",status:"Pendente"},{id:3,date:"2025-06-22",time:"11:00",status:"Cancelada"}]}};function Le(){const{id:x}=Y(),c=x||"18",[t,m]=o.useState(null),[b,i]=o.useState(null),[H,P]=o.useState("visao-geral"),[N,L]=o.useState(null),[W,C]=o.useState(!1),[h,F]=o.useState(""),[p,M]=o.useState(""),[f,I]=o.useState(null),[A,k]=o.useState(null);o.useEffect(()=>{const r=ue[c];r?m(r):i("Serviço não encontrado.")},[c]),o.useEffect(()=>{N&&t?.coordinates&&N.flyTo(t.coordinates,15)},[t?.coordinates,N]);const U=()=>{window.close()},G=()=>{F(""),M(""),I(null),k(null),C(!0)},R=()=>{C(!1)},O=()=>{if(!h||!p){k("Por favor, selecione a data e a hora desejadas.");return}console.log(`Solicitando reserva para ${h} às ${p}`);const r={id:Date.now(),date:h,time:p,status:"Pendente"};m(j=>({...j,reservations:[...j.reservations||[],r]})),I(`Solicitação de reserva para ${h} às ${p} enviada! Aguarde a confirmação.`),k(null)},D=o.useMemo(()=>!t?.feedbacks||t.feedbacks.length===0?0:(t.feedbacks.reduce((j,K)=>j+K.rating,0)/t.feedbacks.length).toFixed(1),[t?.feedbacks]);return b?e.jsx(y,{className:"d-flex justify-content-center align-items-center",style:{height:"100vh"},children:e.jsx($,{className:"autisconnect-alert-danger",children:b})}):t?e.jsxs("div",{className:"app",style:{backgroundColor:a.light,minHeight:"100vh"},children:[e.jsx("style",{children:pe}),e.jsx(B,{expand:"lg",sticky:"top",className:"autisconnect-navbar mb-4",children:e.jsxs(y,{fluid:!0,children:[e.jsx(B.Brand,{href:"/",className:"fw-bold",children:e.jsx("img",{src:de,alt:"Autisconnect Logo",className:"d-inline-block align-top",style:{height:"40px",marginRight:"10px"}})}),e.jsx("span",{className:"navbar-text mx-auto d-none d-lg-block",style:{color:a.white,fontWeight:600},children:t.name}),e.jsxs(v,{className:"autisconnect-btn-primary d-flex align-items-center gap-2",size:"sm",onClick:U,children:[e.jsx(J,{})," Voltar"]})]})}),e.jsxs(y,{fluid:!0,className:"px-3 px-md-4 pb-5",children:[e.jsx(S,{className:"autisconnect-hero mb-4 align-items-center",style:{backgroundImage:`url(${t.mainPhoto})`},children:e.jsxs(u,{className:"autisconnect-hero-overlay p-4 p-md-5 text-white",children:[e.jsx("h1",{className:"display-4 fw-bold mb-3",children:t.name}),e.jsx("p",{className:"lead mb-2",style:{fontSize:"1.3rem",fontWeight:600},children:t.segment}),e.jsx("p",{className:"mb-0",style:{fontSize:"1.05rem",lineHeight:"1.6"},children:t.description||"Descrição do serviço não disponível."})]})}),e.jsx(w.Container,{id:"service-dashboard-tabs",activeKey:H,onSelect:r=>P(r),children:e.jsxs(S,{className:"g-4",children:[e.jsx(u,{lg:3,className:"mb-3 mb-lg-0",children:e.jsxs(d,{variant:"pills",className:"flex-column autisconnect-nav-pills p-4 bg-white rounded-3",style:{boxShadow:"0 2px 8px rgba(0, 61, 122, 0.08)"},children:[e.jsx(d.Item,{className:"mb-2",children:e.jsxs(d.Link,{eventKey:"visao-geral",className:"d-flex align-items-center gap-2",children:[e.jsx(X,{style:{color:a.accent}})," Visão Geral"]})}),e.jsx(d.Item,{className:"mb-3",children:e.jsxs(d.Link,{eventKey:"feedback",className:"d-flex align-items-center gap-2",children:[e.jsx(Z,{style:{color:a.accent}})," Avaliações"]})}),e.jsx("div",{className:"autisconnect-divider"}),e.jsx(d.Item,{children:e.jsxs(v,{className:"autisconnect-btn-primary w-100 d-flex align-items-center justify-content-center gap-2",onClick:G,children:[e.jsx(ee,{})," Solicitar Atendimento"]})})]})}),e.jsx(u,{lg:9,children:e.jsxs(w.Content,{className:"autisconnect-tab-content",children:[e.jsx(w.Pane,{eventKey:"visao-geral",children:e.jsxs(S,{className:"g-4",children:[e.jsxs(u,{md:7,children:[e.jsxs(s,{className:"autisconnect-card mb-4",children:[e.jsxs(s.Header,{className:"autisconnect-card-header",children:[e.jsx(ae,{})," Horário de Funcionamento"]}),e.jsx(s.Body,{style:{padding:"1.5rem"},children:e.jsx("p",{style:{fontSize:"1.1rem",color:a.primary,fontWeight:600,margin:0},children:t.hours})})]}),e.jsxs(s,{className:"autisconnect-card mb-4",children:[e.jsxs(s.Header,{className:"autisconnect-card-header",children:[e.jsx(te,{})," Serviços Oferecidos"]}),e.jsx(n,{variant:"flush",children:t.menuServices?.length>0?t.menuServices.map(r=>e.jsx(n.Item,{className:"autisconnect-list-group-item",style:{border:"none",padding:"1rem"},children:e.jsxs("div",{className:"d-flex justify-content-between align-items-start",children:[e.jsxs("div",{className:"flex-grow-1",children:[e.jsx("div",{className:"fw-bold",style:{color:a.primary,fontSize:"1.05rem",marginBottom:"0.25rem"},children:r.name}),e.jsx("p",{style:{color:a.textMuted,margin:0,fontSize:"0.95rem"},children:r.description})]}),r.price&&e.jsx(me,{className:"autisconnect-badge ms-2",children:r.price})]})},r.id)):e.jsx(n.Item,{style:{padding:"1rem",color:a.textMuted},children:"Nenhum serviço cadastrado."})})]}),e.jsxs(s,{className:"autisconnect-card",children:[e.jsxs(s.Header,{className:"autisconnect-card-header",children:[e.jsx(re,{})," Certificações e Selos"]}),e.jsx(n,{variant:"flush",children:t.certificates?.length>0?t.certificates.map(r=>e.jsxs(n.Item,{style:{padding:"1rem",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",gap:"0.5rem"},children:[e.jsx("span",{style:{color:a.accent,fontSize:"1.2rem"},children:"✓"}),e.jsx("span",{style:{color:a.primary,fontWeight:500},children:r.name})]},r.id)):e.jsx(n.Item,{style:{padding:"1rem",color:a.textMuted},children:"Nenhum certificado cadastrado."})})]})]}),e.jsxs(u,{md:5,children:[e.jsxs(s,{className:"autisconnect-card mb-4",style:{height:"350px"},children:[e.jsxs(s.Header,{className:"autisconnect-card-header",children:[e.jsx(se,{})," Localização"]}),e.jsx("div",{className:"autisconnect-map-container",style:{height:"100%",width:"100%"},children:e.jsxs(_,{center:t.coordinates||[-8.047562,-34.877],zoom:15,style:{height:"100%",width:"100%"},whenCreated:L,children:[e.jsx(q,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}),t.coordinates&&e.jsx(V,{position:t.coordinates,children:e.jsx(Q,{children:t.name})})]})})]}),e.jsxs(s,{className:"autisconnect-card",children:[e.jsxs(s.Header,{className:"autisconnect-card-header",children:[e.jsx(T,{})," Contato"]}),e.jsxs(n,{variant:"flush",children:[e.jsxs(n.Item,{style:{padding:"1rem",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx(T,{style:{color:a.primary}}),e.jsx("span",{style:{color:a.text,fontWeight:500},children:t.contact?.phone||"Não informado"})]}),t.contact?.whatsapp&&e.jsxs(n.Item,{style:{padding:"1rem",borderBottom:`1px solid ${a.border}`,display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx(oe,{style:{color:"#25D366"}}),e.jsx("a",{href:`https://wa.me/${t.contact.whatsapp.replace(/\D/g,"")}`,target:"_blank",rel:"noopener noreferrer",className:"autisconnect-link",children:t.contact.whatsapp})]}),t.contact?.socialMedia?.instagram&&e.jsxs(n.Item,{style:{padding:"1rem",display:"flex",alignItems:"center",gap:"0.75rem"},children:[e.jsx(ne,{style:{color:"#E4405F"}}),e.jsx("a",{href:t.contact.socialMedia.instagram,target:"_blank",rel:"noopener noreferrer",className:"autisconnect-link",children:"Instagram"})]})]})]})]})]})}),e.jsxs(w.Pane,{eventKey:"feedback",children:[e.jsx("h3",{className:"mb-4",style:{color:a.primary,fontWeight:700},children:"Avaliações do Estabelecimento"}),e.jsxs(s,{className:"autisconnect-card mb-4",children:[e.jsx(s.Header,{className:"autisconnect-card-header",children:"Avaliação Média"}),e.jsxs(s.Body,{style:{padding:"2rem",textAlign:"center"},children:[e.jsxs("div",{style:{marginBottom:"1rem"},children:[e.jsx("span",{className:"autisconnect-rating-avg",style:{fontSize:"3rem",marginRight:"1rem"},children:D}),e.jsx(E,{rating:parseFloat(D)})]}),e.jsxs("p",{style:{color:a.textMuted,margin:0,fontSize:"0.95rem"},children:["Baseado em ",t.feedbacks?.length||0," avaliações"]})]})]}),e.jsxs(s,{className:"autisconnect-card",children:[e.jsx(s.Header,{className:"autisconnect-card-header",children:"Comentários de Usuários"}),e.jsx(s.Body,{style:{padding:"1.5rem"},children:t.feedbacks&&t.feedbacks.length>0?t.feedbacks.map(r=>e.jsxs("div",{className:"autisconnect-feedback-item",children:[e.jsxs("div",{className:"d-flex w-100 justify-content-between align-items-center mb-2",children:[e.jsx(E,{rating:r.rating}),e.jsx("small",{style:{color:a.textMuted,fontWeight:500},children:new Date(r.date+"T00:00:00").toLocaleDateString("pt-BR")})]}),e.jsx("p",{style:{color:a.text,margin:0,lineHeight:1.6},children:r.comment})]},r.id)):e.jsx("p",{style:{color:a.textMuted,textAlign:"center",padding:"2rem 0"},children:"Nenhum feedback recebido ainda."})})]})]})]})})]})})]}),e.jsxs(g,{show:W,onHide:R,centered:!0,children:[e.jsx(g.Header,{className:"autisconnect-modal-header",children:e.jsx(g.Title,{style:{fontWeight:700},children:"Solicitar Atendimento"})}),e.jsxs(g.Body,{style:{padding:"2rem"},children:[f&&e.jsx($,{className:"autisconnect-alert-success",style:{marginBottom:"1rem"},children:f}),A&&e.jsx($,{className:"autisconnect-alert-danger",style:{marginBottom:"1rem"},children:A}),!f&&e.jsxs(l,{children:[e.jsxs(l.Group,{className:"mb-3",controlId:"reservationDate",children:[e.jsx(l.Label,{className:"autisconnect-form-label",children:"Data Desejada"}),e.jsx(l.Control,{type:"date",className:"autisconnect-form-control",value:h,onChange:r=>F(r.target.value),min:new Date().toISOString().split("T")[0],required:!0})]}),e.jsxs(l.Group,{className:"mb-3",controlId:"reservationTime",children:[e.jsx(l.Label,{className:"autisconnect-form-label",children:"Hora Desejada"}),e.jsx(l.Control,{type:"time",className:"autisconnect-form-control",value:p,onChange:r=>M(r.target.value),required:!0})]}),e.jsx("p",{style:{color:a.textMuted,fontSize:"0.9rem",marginBottom:0},children:"Sua solicitação será enviada ao estabelecimento para confirmação."})]})]}),e.jsxs(g.Footer,{style:{padding:"1.5rem",borderTop:`1px solid ${a.border}`},children:[e.jsx(v,{className:"autisconnect-btn-secondary",onClick:R,children:"Fechar"}),!f&&e.jsx(v,{className:"autisconnect-btn-primary",onClick:O,children:"Enviar Solicitação"})]})]})]}):e.jsx(y,{className:"d-flex justify-content-center align-items-center",style:{height:"100vh"},children:e.jsx("div",{style:{color:a.primary,fontWeight:600},children:"Carregando informações do serviço..."})})}export{Le as default};
