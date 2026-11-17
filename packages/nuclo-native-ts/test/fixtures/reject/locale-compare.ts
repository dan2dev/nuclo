// expect: localeCompare() depends on the platform's locale data
// code: NUCLO3002
export const names: string[] = ["b", "a"];
names.sort((a, b) => a.localeCompare(b));
