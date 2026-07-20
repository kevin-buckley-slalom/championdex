import { computeFormLabel } from '../pokemonUtils';

describe('computeFormLabel', () => {
  // Default forms: no form_name → no label
  it('default form with no form_name returns null label', () => {
    expect(computeFormLabel('default', null, 'Charizard', 'charizard')).toEqual({ label: null, isPrimal: false });
  });

  // Default forms with form_name set in DB → show label
  it('default form with form_name shows label (Lycanroc Midday)', () => {
    expect(computeFormLabel('default', 'Midday Form', 'Lycanroc', 'lycanroc')).toEqual({ label: 'Midday Form', isPrimal: false });
  });
  it('default form with form_name shows label (Toxtricity Amped)', () => {
    expect(computeFormLabel('default', 'Amped Form', 'Toxtricity', 'toxtricity')).toEqual({ label: 'Amped Form', isPrimal: false });
  });
  it('default form with form_name shows label (Aegislash Shield Forme)', () => {
    expect(computeFormLabel('default', 'Shield Forme', 'Aegislash', 'aegislash')).toEqual({ label: 'Shield Forme', isPrimal: false });
  });
  it('default form with form_name shows label (Zygarde 50%)', () => {
    expect(computeFormLabel('default', '50%', 'Zygarde', 'zygarde')).toEqual({ label: '50%', isPrimal: false });
  });
  it('default form with form_name shows label (Ogerpon Teal Mask)', () => {
    expect(computeFormLabel('default', 'Teal Mask', 'Ogerpon', 'ogerpon')).toEqual({ label: 'Teal Mask', isPrimal: false });
  });
  it('default form with form_name shows label (Eiscue Ice Face)', () => {
    expect(computeFormLabel('default', 'Ice Face', 'Eiscue', 'eiscue')).toEqual({ label: 'Ice Face', isPrimal: false });
  });
  it('default form with form_name shows label (Palafin Zero Form)', () => {
    expect(computeFormLabel('default', 'Zero Form', 'Palafin', 'palafin')).toEqual({ label: 'Zero Form', isPrimal: false });
  });
  it('default form with form_name shows label (Hoopa Confined)', () => {
    expect(computeFormLabel('default', 'Confined', 'Hoopa', 'hoopa')).toEqual({ label: 'Confined', isPrimal: false });
  });
  it('default form with form_name shows label (Urshifu Single-Strike)', () => {
    expect(computeFormLabel('default', 'Single-Strike', 'Urshifu', 'urshifu')).toEqual({ label: 'Single-Strike', isPrimal: false });
  });
  it('default form with form_name shows label (Burmy Plant Cloak)', () => {
    expect(computeFormLabel('default', 'Plant Cloak', 'Burmy', 'burmy')).toEqual({ label: 'Plant Cloak', isPrimal: false });
  });

  // Regional forms: display_name includes prefix, no form label
  it('simple regional form returns null label (Alolan Vulpix)', () => {
    expect(computeFormLabel('regional', null, 'Alolan Vulpix', 'vulpixalola')).toEqual({ label: null, isPrimal: false });
  });
  it('simple regional form returns null label (Galarian Slowpoke)', () => {
    expect(computeFormLabel('regional', null, 'Galarian Slowpoke', 'slowpokegalar')).toEqual({ label: null, isPrimal: false });
  });
  it('simple regional form returns null label (Hisuian Typhlosion)', () => {
    expect(computeFormLabel('regional', null, 'Hisuian Typhlosion', 'typhlosionhisui')).toEqual({ label: null, isPrimal: false });
  });
  it('simple regional form returns null label (Paldean Wooper)', () => {
    expect(computeFormLabel('regional', null, 'Paldean Wooper', 'wooperpaldea')).toEqual({ label: null, isPrimal: false });
  });
  // Compound regional forms with qualifier label
  it('compound regional with form_name shows label (Paldean Tauros Combat Breed)', () => {
    expect(computeFormLabel('regional', 'Combat Breed', 'Paldean Tauros', 'taurospaldeacombat')).toEqual({ label: 'Combat Breed', isPrimal: false });
  });
  it('compound regional with form_name shows label (Paldean Tauros Blaze Breed)', () => {
    expect(computeFormLabel('regional', 'Blaze Breed', 'Paldean Tauros', 'taurospaldeablaze')).toEqual({ label: 'Blaze Breed', isPrimal: false });
  });
  it('compound regional with form_name shows label (Galarian Darmanitan Zen Mode)', () => {
    expect(computeFormLabel('regional', 'Zen Mode', 'Galarian Darmanitan', 'darmanitangalarzen')).toEqual({ label: 'Zen Mode', isPrimal: false });
  });

  // Mega forms: standard suffixes already in display_name → no label
  it('mega form with no qualifier returns null label (Mega Charizard X)', () => {
    expect(computeFormLabel('mega', 'Mega-X', 'Mega Charizard X', 'charizardmegax')).toEqual({ label: null, isPrimal: false });
  });
  it('mega form with no qualifier returns null label (Mega Venusaur)', () => {
    expect(computeFormLabel('mega', 'Mega', 'Mega Venusaur', 'venusaurmega')).toEqual({ label: null, isPrimal: false });
  });
  it('mega form Mega-Z returns null label', () => {
    expect(computeFormLabel('mega', 'Mega-Z', 'Mega Absol Z', 'absolmegaz')).toEqual({ label: null, isPrimal: false });
  });
  // Compound mega: female qualifier → "Female" label
  it('mega form with F qualifier returns Female label (Mega Meowstic)', () => {
    expect(computeFormLabel('mega', 'F', 'Mega Meowstic', 'meowsticfmega')).toEqual({ label: 'Female', isPrimal: false });
  });
  it('mega form with M qualifier returns null label (Mega Meowstic)', () => {
    expect(computeFormLabel('mega', 'M', 'Mega Meowstic', 'meowsticmmega')).toEqual({ label: null, isPrimal: false });
  });
  // Primal: display_name already includes "Primal" — suppress the label to avoid redundant text
  it('alternate Primal form returns null label (Primal Kyogre)', () => {
    expect(computeFormLabel('alternate', 'Primal', 'Primal Kyogre', 'kyogreprimal')).toEqual({ label: null, isPrimal: false });
  });
  it('alternate Primal form returns null label (Primal Groudon)', () => {
    expect(computeFormLabel('alternate', 'Primal', 'Primal Groudon', 'groudonprimal')).toEqual({ label: null, isPrimal: false });
  });

  // Gigantamax forms: no label
  it('gigantamax form returns null label (Gigantamax Venusaur)', () => {
    expect(computeFormLabel('gigantamax', 'Gmax', 'Gigantamax Venusaur', 'venusaurgmax')).toEqual({ label: null, isPrimal: false });
  });
  it('gigantamax compound form with qualifier shows label (Gigantamax Toxtricity Low-Key)', () => {
    expect(computeFormLabel('gigantamax', 'Low-Key', 'Gigantamax Toxtricity', 'toxtricitylow-keygmax')).toEqual({ label: 'Low-Key', isPrimal: false });
  });

  // Cosmetic forms
  it('cosmetic Female form returns Female label (Indeedee-F)', () => {
    expect(computeFormLabel('cosmetic', 'F', 'Indeedee', 'indeedeef')).toEqual({ label: 'Female', isPrimal: false });
  });
  it('cosmetic Nidoran ♀ returns null label (symbol in display_name)', () => {
    expect(computeFormLabel('cosmetic', null, 'Nidoran ♀', 'nidoranf')).toEqual({ label: null, isPrimal: false });
  });
  it('cosmetic Nidoran ♂ returns null label (symbol in display_name)', () => {
    expect(computeFormLabel('cosmetic', null, 'Nidoran ♂', 'nidoranm')).toEqual({ label: null, isPrimal: false });
  });

  // Alternate forms: show form_name as label
  it('alternate form shows label (Zygarde 10%)', () => {
    expect(computeFormLabel('alternate', '10%', 'Zygarde', 'zygarde10')).toEqual({ label: '10%', isPrimal: false });
  });
  it('alternate form shows label (Zygarde Complete)', () => {
    expect(computeFormLabel('alternate', 'Complete', 'Zygarde', 'zygardeComplete')).toEqual({ label: 'Complete', isPrimal: false });
  });
  it('alternate form shows label (Aegislash Blade Forme)', () => {
    expect(computeFormLabel('alternate', 'Blade Forme', 'Aegislash', 'aegislashblade')).toEqual({ label: 'Blade Forme', isPrimal: false });
  });
  it('alternate form shows label (Calyrex Ice Rider)', () => {
    expect(computeFormLabel('alternate', 'Ice Rider', 'Calyrex', 'calyrexice')).toEqual({ label: 'Ice Rider', isPrimal: false });
  });
  it('alternate form shows label (Calyrex Shadow Rider)', () => {
    expect(computeFormLabel('alternate', 'Shadow Rider', 'Calyrex', 'calyrexshadow')).toEqual({ label: 'Shadow Rider', isPrimal: false });
  });
  it('alternate form shows label (Rotom Heat)', () => {
    expect(computeFormLabel('alternate', 'Heat', 'Rotom', 'rotomheat')).toEqual({ label: 'Heat', isPrimal: false });
  });
  it('alternate form shows label (Oricorio Pa\'u Style)', () => {
    expect(computeFormLabel('alternate', "Pa'u Style", 'Oricorio', 'oricoriopau')).toEqual({ label: "Pa'u Style", isPrimal: false });
  });
  it('alternate form shows label (Ogerpon Teal Mask Tera)', () => {
    expect(computeFormLabel('alternate', 'Teal Mask Tera', 'Ogerpon', 'ogerpontealtera')).toEqual({ label: 'Teal Mask Tera', isPrimal: false });
  });
  it('alternate form shows label (Ogerpon Cornerstone Mask)', () => {
    expect(computeFormLabel('alternate', 'Cornerstone Mask', 'Ogerpon', 'ogerponcornerstone')).toEqual({ label: 'Cornerstone Mask', isPrimal: false });
  });
  it('alternate form shows label (Lycanroc Midnight Form)', () => {
    expect(computeFormLabel('alternate', 'Midnight Form', 'Lycanroc', 'lycanrocmidnight')).toEqual({ label: 'Midnight Form', isPrimal: false });
  });
  it('alternate form shows label (Urshifu Rapid-Strike)', () => {
    expect(computeFormLabel('alternate', 'Rapid-Strike', 'Urshifu', 'urshifurapidstrike')).toEqual({ label: 'Rapid-Strike', isPrimal: false });
  });
  it('alternate form with no form_name returns null', () => {
    expect(computeFormLabel('alternate', null, 'Bloodmoon Ursaluna', 'ursalunabloodmoon')).toEqual({ label: null, isPrimal: false });
  });
  it('alternate form with no form_name for Ultra Necrozma returns null', () => {
    expect(computeFormLabel('alternate', null, 'Ultra Necrozma', 'necrozmaultra')).toEqual({ label: null, isPrimal: false });
  });
});
