const organicAnimateSpirograph=(e,i,n,o,r,a,t,p,s,c,g,m)=>{const d=(e,i,n,o,r)=>(e-i)*(r-o)/(n-i)+o,h=g.noise1(e),A=g.noise1(e+1e4);g.noise1(e+100);if(Math.ceil(1e7*e)%3==0){const e=d(h,0,1,n,o),c=d(A,0,1,r,a),g=d(h,0,1,t,p),S=s;i.R=e,i.r=c,i.p=g,i.desity=S,i.render(m)}window.requestAnimationFrame((m=>{organicAnimateSpirograph(e+1e-6*(h+A),i,n,o,r,a,t,p,s,c,g,m)}))};export default organicAnimateSpirograph;