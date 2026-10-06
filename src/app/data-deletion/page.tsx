import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Data Deletion | IgHouse",
  description:
    "Learn how to revoke Instagram access and request deletion of your IgHouse account data.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      description="You can revoke IgHouse’s Instagram access and separately request deletion of the information associated with your IgHouse account."
      title="Data Deletion Instructions"
    >
      <section>
        <h2>Revoke IgHouse access from Instagram</h2>
        <ol>
          <li>Log in to the Instagram account connected to IgHouse.</li>
          <li>
            Open Instagram settings and find the section for website
            permissions, apps and websites, or connected apps. The exact label
            can vary by app version and account type.
          </li>
          <li>
            Find IgHouse in the active or connected apps list and choose the
            option to remove or revoke its access.
          </li>
          <li>
            If you authorized IgHouse through a Facebook Page or Meta Business
            integration, also review and remove the IgHouse integration in
            your Facebook or Meta Business settings.
          </li>
        </ol>
        <p>
          Revoking access prevents future authorized API access but does not
          automatically delete data already held in your IgHouse account.
          Follow the request steps below to ask us to delete that data too.
        </p>
      </section>

      <section>
        <h2>Request deletion of your IgHouse data</h2>
        <ol>
          <li>
            Email{" "}
            <a href="mailto:privacy@ighouse.app?subject=IgHouse%20data%20deletion%20request">
              privacy@ighouse.app
            </a>{" "}
            from the email address associated with your IgHouse account.
          </li>
          <li>
            Use the subject line <strong>IgHouse data deletion request</strong>{" "}
            and include your IgHouse account email and the Instagram username
            you connected. Do not include your password, access token, or other
            credentials.
          </li>
          <li>
            We may contact you to verify that you control the account before
            processing the request. We will confirm when the request has been
            completed or let you know if additional information is needed.
          </li>
        </ol>
        <p>
          We will delete or de-identify account information, connected account
          data, contacts, interaction records, and automation data associated
          with your request, subject to legal retention requirements. Limited
          records may remain where required by law or needed to establish,
          exercise, or defend legal claims; those records will be restricted
          and retained only as necessary. Data in routine backups may persist
          until those backups are overwritten.
        </p>
      </section>

      <section>
        <h2>What happens next</h2>
        <p>
          We will use the information in your request only to verify and
          fulfill it. If you want to keep using IgHouse with the same
          Instagram account, wait until you are ready to reconnect it before
          revoking access. For help with a deletion request, contact{" "}
          <a href="mailto:privacy@ighouse.app">privacy@ighouse.app</a>.
        </p>
      </section>
    </LegalPage>
  );
}
