# Contributing to AIE

Thank you for your interest in improving the **Framework for Ethical Impact Self-Assessment in AI for the Public Sector (AIE)**. Contributions of all kinds are welcome: bug reports, documentation, translations, questionnaire improvements and code.

The official repository is **[gestaogovbr/etica-ia-governanca](https://github.com/gestaogovbr/etica-ia-governanca)**, maintained by the Ministério da Gestão e da Inovação em Serviços Públicos (MGI).

By participating in this project you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs and requesting features

- Search the [issue tracker](https://github.com/gestaogovbr/etica-ia-governanca/issues) first to avoid duplicates.
- Open a new issue describing what you expected, what happened, the steps to reproduce it and which component is affected (`front-end`, `back-end-nestjs`, `back-end-java`).
- Issues may be written in **English or Portuguese**.
- **Do not** report security vulnerabilities in public issues — follow [SECURITY.md](SECURITY.md).
- Never include personal data (names, CPF, e-mails of real users) or credentials in issues, logs or screenshots.

## Submitting changes

1. Fork the repository and create a branch from `main` (e.g. `fix/results-screen`, `docs/english-readme`).
2. Set up the component you are changing by following its README ([front-end](front-end/README.md), [back-end-nestjs](back-end-nestjs/README.md), [back-end-java](back-end-java/README.md)).
3. Keep changes focused; one pull request per topic.
4. Run the checks for the component you touched:

   ```bash
   # front-end
   npm run lint && npm run build

   # back-end-nestjs
   npm run lint && npm test && npm run build

   # back-end-java
   mvn -q compile
   ```

5. If you change an API route or payload, update **both** back-ends (they expose the same API) or explain in the pull request why only one is affected.
6. If you add or change UI strings, update all language files in `front-end/src/service/languages/` (`pt`, `en`, `es`, `fr`).
7. Use clear commit messages, preferably following [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:` …).
8. Open a pull request against `main` describing the change and how it was tested.

## Licensing of contributions

AIE is licensed under the [GNU General Public License v3.0](LICENSE). By submitting a contribution you agree that it is licensed under the same terms.

## Contact

For questions that do not fit an issue, contact **assint.sgd@gestao.gov.br**.
