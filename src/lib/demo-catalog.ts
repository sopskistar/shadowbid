export type DemoDomain = {
  slug:string;
  domain:string;
  category:string;
  description:string;
  illustrativeZats:bigint;
};

// Editorial examples only. These records never enter the auction or invoice database.
export const demoDomains:DemoDomain[]=[
  {slug:'veltrix-com',domain:'Veltrix.com',category:'Brandable',description:'A compact name for a new consumer or software brand.',illustrativeZats:1_000_000n},
  {slug:'cloudharbor-ai',domain:'CloudHarbor.ai',category:'Technology / AI',description:'An illustrative name for private cloud infrastructure.',illustrativeZats:3_500_000n},
  {slug:'bestcontractor-com',domain:'BestContractor.com',category:'Exact Match',description:'A direct phrase for a contractor marketplace.',illustrativeZats:6_000_000n},
  {slug:'austintailors-com',domain:'AustinTailors.com',category:'Geo Domains',description:'A city-focused name for a local service.',illustrativeZats:8_500_000n},
  {slug:'novagrid-xyz',domain:'NovaGrid.xyz',category:'Startup',description:'A name for a network or energy experiment.',illustrativeZats:11_000_000n},
  {slug:'opencanvas-org',domain:'OpenCanvas.org',category:'Organizations',description:'A creative community or nonprofit concept.',illustrativeZats:1_000_000n},
  {slug:'brandpulse-com',domain:'BrandPulse.com',category:'Premium',description:'A concise name for brand analytics.',illustrativeZats:3_500_000n},
  {slug:'quantumforge-ai',domain:'QuantumForge.ai',category:'Technology / AI',description:'An illustrative advanced-computing brand.',illustrativeZats:6_000_000n},
  {slug:'brightnest-com',domain:'BrightNest.com',category:'Brandable',description:'A warm name for a home or family product.',illustrativeZats:8_500_000n},
  {slug:'urbancraft-xyz',domain:'UrbanCraft.xyz',category:'Startup',description:'A name for a design or city-making project.',illustrativeZats:11_000_000n},
  {slug:'summitlabs-org',domain:'SummitLabs.org',category:'Organizations',description:'A research collective concept.',illustrativeZats:1_000_000n},
  {slug:'pixelharbor-com',domain:'PixelHarbor.com',category:'Premium',description:'A creative technology brand concept.',illustrativeZats:3_500_000n},
];

export type DemoSort='name'|'price-low'|'price-high'|'category';
export function filterDemoDomains(options:{query:string;extension:string;category:string;sort:DemoSort}){
  const query=options.query.trim().toLowerCase();
  return demoDomains.filter(item=>(!query||item.domain.toLowerCase().includes(query)||item.description.toLowerCase().includes(query))&&
    (options.extension==='all'||item.domain.split('.').pop()?.toLowerCase()===options.extension)&&
    (options.category==='all'||item.category===options.category)).sort((a,b)=>{
      if(options.sort==='price-low')return a.illustrativeZats<b.illustrativeZats?-1:a.illustrativeZats>b.illustrativeZats?1:a.domain.localeCompare(b.domain);
      if(options.sort==='price-high')return a.illustrativeZats>b.illustrativeZats?-1:a.illustrativeZats<b.illustrativeZats?1:a.domain.localeCompare(b.domain);
      if(options.sort==='category')return a.category.localeCompare(b.category)||a.domain.localeCompare(b.domain);
      return a.domain.localeCompare(b.domain);
    });
}
