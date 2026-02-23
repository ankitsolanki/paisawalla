import poonawallaLogo from '@assets/poonawalla-logo_1771828943668.webp';
import prefrLogo from '@assets/prefr-logo_1771828943668.webp';
import abflLogo from '@assets/abfl-logo_1771828943668.webp';
import heroFincorpLogo from '@assets/hero-fincorp-logo_1771828943667.webp';
import mpokketLogo from '@assets/mpokket-logo_1771828943668.webp';

const LENDER_LOGOS = {
  poonawalla: poonawallaLogo,
  poonawaala: poonawallaLogo,
  poonawallastpl: poonawallaLogo,
  'poonwalla stpl': poonawallaLogo,
  poonwallastpl: poonawallaLogo,
  prefr: prefrLogo,
  prefer: prefrLogo,
  abfl: abflLogo,
  adityabirlacapital: abflLogo,
  adityabirla: abflLogo,
  herofincorp: heroFincorpLogo,
  'hero fincorp': heroFincorpLogo,
  hero_fincorp: heroFincorpLogo,
  mpokket: mpokketLogo,
};

export function getLenderLogo(name) {
  if (!name) return null;
  const key = name.toLowerCase().replace(/[\s_-]+/g, '').trim();
  if (LENDER_LOGOS[key]) return LENDER_LOGOS[key];
  const keyUnder = name.toLowerCase().replace(/[\s_-]+/g, '_').trim();
  if (LENDER_LOGOS[keyUnder]) return LENDER_LOGOS[keyUnder];
  const keySpace = name.toLowerCase().trim();
  if (LENDER_LOGOS[keySpace]) return LENDER_LOGOS[keySpace];
  return null;
}

export default LENDER_LOGOS;
