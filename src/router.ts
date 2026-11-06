const path = window.location.pathname.replace(/\/+$/, '');
const route = path === '/lab' ? 'lab' : 'home';

import(`./routes/${route}.ts`);
