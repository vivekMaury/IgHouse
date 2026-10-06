import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | IgHouse",
  description:
    "Learn how IgHouse accesses, uses, stores, and protects information connected to your account and Instagram accounts.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      description="This policy explains what information IgHouse processes when you use our Instagram automation service, why we process it, and the choices available to you."
      title="Privacy Policy"
    >
      <section>
        <h2>1. Information we process</h2>
        <p>
          Depending on the features you use and the permissions you authorize,
          IgHouse may process:
        </p>
        <ul>
          <li>
            Your account information, such as your email address and
            authentication details, which are managed by our authentication
            provider.
          </li>
          <li>
            Instagram account identifiers and profile information made
            available through the Meta Graph API, such as an account ID and
            username.
          </li>
          <li>
            Page access tokens needed to connect your Instagram account, along
            with comments, messages, webhook events, and related interaction
            data needed to run the automations you configure.
          </li>
          <li>
            Your automation settings, workflow content, service logs, and
            subscription or transaction records where applicable.
          </li>
        </ul>
        <p>
          We request and process Meta data only as needed to provide the
          features you choose and only within the permissions Meta grants.
          IgHouse does not use this data to build advertising profiles or to
          independently advertise to your Instagram contacts.
        </p>
      </section>

      <section>
        <h2>2. How we use information</h2>
        <p>We use information to:</p>
        <ul>
          <li>Provide, operate, and secure IgHouse and its automation features.</li>
          <li>
            Receive eligible events from Meta and perform the actions you
            configure, such as organizing interactions or sending an automated
            reply.
          </li>
          <li>
            Maintain your account, respond to support requests, diagnose
            failures, and meet legal or platform obligations.
          </li>
        </ul>
        <p>
          IgHouse does not sell personal information. We do not share Instagram
          account or interaction data with other IgHouse users, advertisers, or
          data brokers. We share information only with service providers acting
          for us to operate the service, with Meta as needed to provide
          Instagram features, when you direct us to, or when disclosure is
          legally required. Service providers are permitted to process data
          only to provide their services to IgHouse.
        </p>
      </section>

      <section>
        <h2>3. Meta Graph API data and your controls</h2>
        <p>
          When you connect an Instagram account, IgHouse uses the Meta Graph
          API to access the information allowed by your authorization and
          Meta&apos;s platform rules. Meta independently processes information
          under its own policies and terms. You can revoke an authorization
          through your Meta or Instagram settings at any time. Revocation may
          stop connected features from working but does not by itself submit a
          request to delete your IgHouse account data; see our{" "}
          <a href="/data-deletion">data deletion instructions</a>.
        </p>
      </section>

      <section>
        <h2>4. Storage and security</h2>
        <p>
          Account and service data is stored with our service providers,
          including Supabase. Instagram Page access tokens are encrypted before
          storage using AES-256-GCM; the encryption key is held separately in
          server-side configuration and is not exposed to the browser. We use
          access controls and safeguards intended to protect information from
          unauthorized access, alteration, or disclosure. No method of
          transmission or storage can be guaranteed to be completely secure.
        </p>
      </section>

      <section>
        <h2>5. Retention and deletion</h2>
        <p>
          We retain information while it is needed to provide the service,
          maintain your account, resolve disputes, or meet legal obligations.
          You may request deletion of your account and associated data by
          following the steps on our{" "}
          <a href="/data-deletion">data deletion page</a>. Some limited
          information may be retained where required by law or for legitimate
          security and accounting purposes; retained data is handled in
          accordance with this policy.
        </p>
      </section>

      <section>
        <h2>6. Your choices and contact</h2>
        <p>
          You can disconnect Instagram access through Instagram&apos;s settings
          and request deletion of IgHouse data as described above. For privacy
          questions or requests, email{" "}
          <a href="mailto:info@ighouse.app">info@ighouse.app</a>. Do not
          email us your password or access token.
        </p>
      </section>
    </LegalPage>
  );
}
