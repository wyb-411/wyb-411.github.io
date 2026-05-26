declare module "jsrsasign" {
  export const KEYUTIL: {
    getKey: (pem: string) => unknown;
  };
  export const KJUR: {
    jws: {
      JWS: {
        sign: (alg: string, header: string, payload: string, key: unknown) => string;
      };
    };
  };
}
