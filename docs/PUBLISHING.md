# Publish the ErgonUI CLI

The public command `bunx @ergonui/cli ...` downloads **@ergonui/cli from npm**. GitHub hosts development source; Netlify hosts component payloads. Publishing the CLI is a separate release step. Do not publish the private repository root.

## 1. Prepare your npm account and scope

1. [Create an npm account](https://www.npmjs.com/signup), verify its email, and enable two-factor authentication.
2. In your npm profile menu, choose **Add an Organization**.
3. Create the **ergonui** organization and choose the free **Unlimited public packages** plan if that scope is available. An organization owner must give your account publishing access if the organization already exists.
4. If `ergonui` is unavailable, use an npm scope you control and change the package name and documented commands consistently before the first release.

An unpublished package does not imply that its organization name is available. The package name `@ergonui/cli` requires access to the npm `ergonui` scope; your GitHub account/repository name does not reserve it.

## 2. Deploy the registry revision

Push the intended component revision and deploy it to Netlify. Build with `bun run build`, publish `dist`, and set `REGISTRY_URL=https://ergonui.netlify.app` in Netlify's build environment. Check the actual selected-component URLs return registry JSON, particularly `/r/line-chart.json` and `/r/pie-chart.json`, before advertising chart creation.

## 3. Build and test the package

```sh
cd packages/cli
bun install --frozen-lockfile
bun run check
bun run test
bun run build
npm pack --dry-run
```

Inspect the package contents. The allowlist contains the executable, bundled starter, README, LICENSE, and npm package metadata. The documentation application, tests, node_modules and development output must not be in the tarball. `prepack` rebuilds the executable/template before packing or publishing.

For a real tarball, put artifacts in ignored output:

```sh
npm pack --pack-destination ../../output
```

Install that tarball in a disposable directory outside the ErgonUI repository, execute its `ergonui` binary, create an application, and run `bun run build`. Test both the default deployed registry and `--registry` against local pending component work. Package tests alone do not prove that the public registry has the current components.

## 4. Log in and publish

### First release: already staged

`@ergonui/cli@0.1.0` has been staged under the `ergonui` organization. npm created the temporary public `0.0.0-stage` placeholder; this is not the installable CLI release. The tarball's SHA-1 is `e1f056f329bc659fd5b27eb5ffcd3e31be8d7805`.

Open [Staged Packages](https://www.npmjs.com/settings/ganonym741/staged-packages) to inspect it. Wait for npm's automated validation, deploy the registry revision, then approve the staged version and complete the 2FA prompt. Do not run a second direct publish for version 0.1.0 while it is staged: staged and published versions share the same version namespace.

The machine's installed npm 11.14.1 does not support `stage`; the tested one-off client is npm 11.21.1. It does not replace the global npm installation:

```sh
npx --yes --package npm@11.21.1 npm stage list @ergonui/cli
```

The stage ID and creation result are retained locally in ignored `output/npm-stage-release.json`. The organization/package setup and terminal login are complete; approval publishes the installable release.

### Direct publishing for unstaged future versions

From `packages/cli`, with your own npm account:

```sh
npm login
npm whoami
npm publish --access public
```

Complete npm's browser login and 2FA prompts yourself. Do not paste account passwords, tokens, or recovery codes into documentation or chat. `publishConfig.access` is also set to `public`; the explicit flag makes first-release visibility clear.

## 5. Verify from a clean environment

After publication and deployment:

```sh
npm view @ergonui/cli version
bunx @ergonui/cli@0.1.0 --version
bunx @ergonui/cli@0.1.0 create my-app --components line-chart,pie-chart
cd my-app
bun run build
bun run dev
```

Verify that installed source and license files are present, aliases resolve, the starter builds, and selected components render when imported using the handbook examples. Update the website's publication notice once this public-package check succeeds.

For later releases, change the CLI package version, rerun validation and publish a new version. npm does not let you replace an already published name/version. The build template/dependencies are included with each CLI release; source installed through the unversioned registry URL follows the deployed registry revision.

References: [npm scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/), [creating an organization](https://docs.npmjs.com/creating-an-organization/), and [publishing with 2FA](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/).
