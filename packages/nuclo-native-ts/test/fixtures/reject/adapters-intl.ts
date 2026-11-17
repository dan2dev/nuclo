// expect: Locale data differs per platform
// code: NUCLO1002
export const text = new Intl.NumberFormat("en").format(3);
