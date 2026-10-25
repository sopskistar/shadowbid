const privateHeaders=[
  {key:'Cache-Control',value:'private, no-store, max-age=0'},
  {key:'Referrer-Policy',value:'no-referrer'},
  {key:'X-Robots-Tag',value:'noindex, nofollow'},
];

const nextConfig={
  async headers(){
    return ['/checkout/:path*','/api/checkout/:path*','/dashboard/:path*','/settings','/auctions/:id/reveal','/api/imports/:path*','/api/judge/:path*','/api/auth/:path*'].map(source=>({source,headers:privateHeaders}));
  },
};

export default nextConfig;
