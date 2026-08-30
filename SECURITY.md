# Security Policy | Güvenlik Politikası

## Supported Versions | Desteklenen Sürümler

Only the latest release of DTS is supported for security updates.

DTS'nin yalnızca en son sürümü güvenlik güncellemeleri için desteklenmektedir.

| Version | Supported |
| ------- | --------- |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:        |

## Reporting a Vulnerability | Güvenlik Açığı Bildirme

If you discover a security vulnerability in this project, please do NOT open a public GitHub issue. Instead, report it privately to the maintainers.

Bu projede bir güvenlik açığı keşfederseniz, lütfen herkese açık bir GitHub Issue'su açmayın. Bunun yerine, bulgularınızı özel olarak yöneticilere bildirin.

You can report vulnerabilities by sending an email to:
Güvenlik açıklarını şu e-posta adresine bildirerek iletebilirsiniz:
* **security@dts.local** (or contact the repository owner / veya depo sahibi ile iletişime geçin)

Please include:
* A description of the vulnerability.
* Steps to reproduce the issue.
* Any potential impact.

Lütfen şunları ekleyin:
* Güvenlik açığının tanımı.
* Sorunu yeniden oluşturmak için adımlar.
* Olası etkiler.

We will acknowledge your report within 48 hours and provide a fix as soon as possible.
Bildiriminizi 48 saat içinde yanıtlayacağız ve mümkün olan en kısa sürede bir düzeltme sunacağız.

## Known Open Vulnerabilities | Bilinen Açık Zafiyetler

The following vulnerabilities have been identified by `npm audit` but cannot be fixed without breaking changes. They are tracked here for transparency:

| Package | Severity | Advisory | Notes |
|---------|----------|----------|-------|
| `esbuild ≤ 0.24.2` | Moderate | [GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99) | Dev-only; bundled as a transitive dep of `vite`. Not present in production build. Fix requires `vite` major upgrade. |
| `react-router 6.x / react-router-dom 6.x` | Moderate–High | [GHSA-wrjc-x8rr-h8h6](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6), [GHSA-337j-9hxr-rhxg](https://github.com/advisories/GHSA-337j-9hxr-rhxg) | Open redirect and SSR deserialization issues. Fix requires upgrading to `react-router-dom@7.x` (breaking API changes). |

These will be addressed in a future release when the upgrade path is planned.
Bu sorunlar, yükseltme yolu planlandığında gelecekteki bir sürümde ele alınacaktır.
