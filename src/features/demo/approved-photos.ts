import type { PhotoManifest } from '@/content/vnest-workbook/photo-manifest';
/** Exact originals inspected for the 23/10 local demo. No people; source files untouched.
 * Sources: docs/qa/demo/nang-page-2026-10-23/sources.json and previous CEO polish evidence. */
const SOURCES = {
  "nang-blue-moon-17": {
    "driveFileId": "16U9iuZuwTWXw8hqGqcqp9OKhnR_m0QK3",
    "sha256": "1fa767846a665145b83c29118a4a7bd60c3d0d0fee72ed6176e523e6d05c5722"
  },
  "nang-blue-moon-14": {
    "driveFileId": "10WSAdJ87KpzjGLr0bucHaoH068Djl-LK",
    "sha256": "a419d4ff8c5aa9dbd1ecea6b05df5487c4acacc9485f31a9dde6d08d0fa85b63"
  },
  "nang-blue-moon-18": {
    "driveFileId": "1fa3OhAg0JPyWzSSSSM-0ES4jSYs8GGKm",
    "sha256": "edbf101d7c8d6dba58b92348eb785f8ce4104d8406d9e4dca2a5130de3efb7ad"
  },
  "nang-yellow-7": {
    "driveFileId": "1kHzZ4ZVumwAMysYOBQfwMY8GVKPqMY32",
    "sha256": "ae19ba9f8ed7f81be18858def44ea179a544ec20515a0c8e1e52b02888edc52b"
  },
  "nang-yellow-4": {
    "driveFileId": "1n7W30NIgqEVugF11hczm4jKtxUp7e6Bk",
    "sha256": "dd6e0c70065ec5fd53f0038e049b39ecdc4a197a71294c31402a226cba2902e4"
  },
  "nang-pale-4": {
    "driveFileId": "105G-i5K0nP5eQNhxrSLNcm7c5qciiwiM",
    "sha256": "3041966107809f20679777ca05b4ab843d7ea2e360aacbdb140e4900b0d0634a"
  },
  "bare-han-ground-26": {
    "driveFileId": "1Z4vuWjXfnmulrXzy9cfMm_raSCjlehN-",
    "sha256": "fc4965325d2000e6aad6269b8b6e14548e6198ba2cbe0b2be248c6006b5c978e"
  },
  "the-nang-suites": {
    "driveFileId": "135fYrwL4yxt7jR0K0eSre400uuh_Ufro",
    "sha256": "13ca0898f9ecce41d958bad0759691653a73931b51e42bb450bfe3253e51a600"
  }
} as const;
export function approvedDemoPhoto(manifest: PhotoManifest | null, key: string) {
  const source=SOURCES[key as keyof typeof SOURCES], entry=manifest?.photos[key];
  return source && entry && entry.driveFileId===source.driveFileId && entry.sha256===source.sha256 && entry.variants.some(v=>v.type==='image/jpeg') ? entry : null;
}
