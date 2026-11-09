/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_COMMUNITY_REGISTER_ADDRESS_TESTNET?: string;
  readonly VITE_COMMUNITY_REGISTER_ADDRESS_MAINNET?: string;
  readonly VITE_WALLETCONNECT_PROJECT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

