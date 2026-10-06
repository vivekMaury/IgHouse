import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service | IgHouse",
  description:
    "Read the terms that apply when you use IgHouse Instagram automation services.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPage
      description="These terms govern your access to and use of IgHouse. By creating an account or using the service, you agree to these terms."
      title="Terms of Service"
    >
      <section>
        <h2>1. The service</h2>
        <p>
          IgHouse provides tools for configuring and managing Instagram
          automations. Features may change over time. Some features depend on
          Meta, Instagram, and other third-party services, which are not
          controlled by IgHouse and may change or become unavailable.
        </p>
      </section>

      <section>
        <h2>2. Accounts and responsibilities</h2>
        <ul>
          <li>
            Provide accurate account information and keep your login
            credentials secure. You are responsible for activity under your
            account and for promptly notifying us of suspected unauthorized
            access.
          </li>
          <li>
            Connect only accounts you own or are authorized to manage, and
            obtain any consent required to contact people through those
            accounts.
          </li>
          <li>
            Review and test your automations. You are responsible for the
            messages, rules, and actions you configure and for responding to
            people who contact your Instagram account.
          </li>
          <li>
            Keep your contact and billing information current and comply with
            the laws and platform terms that apply to your use.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. Acceptable use</h2>
        <p>You may not use IgHouse to:</p>
        <ul>
          <li>
            Send unsolicited, misleading, harassing, or unlawful messages, or
            violate another person&apos;s privacy or rights.
          </li>
          <li>
            Spam, impersonate another person, distribute harmful content, or
            attempt to evade Instagram or Meta rate limits, restrictions, or
            enforcement.
          </li>
          <li>
            Violate Meta&apos;s or Instagram&apos;s terms, policies, or
            developer requirements, or use the service in a way that could
            compromise its security or availability.
          </li>
        </ul>
        <p>
          You must configure automations to comply with Meta&apos;s current
          platform rules, including restrictions on messaging and permitted
          interaction windows. We may suspend or limit access to protect users,
          the service, or platform integrity.
        </p>
      </section>

      <section>
        <h2>4. Subscriptions and payment</h2>
        <p>
          Some features may require a paid subscription. Any applicable plan,
          price, billing interval, and renewal terms will be shown before you
          subscribe. Unless the checkout page says otherwise, a subscription
          renews for the displayed billing interval until canceled. You
          authorize the payment provider shown at checkout to charge the
          applicable fees and taxes.
        </p>
        <p>
          You may cancel using the available account or billing controls.
          Cancellation generally takes effect at the end of the current paid
          period; access remains available until then unless stated otherwise.
          Fees already paid are non-refundable except where required by law or
          expressly stated at checkout. We will provide notice of material
          changes to subscription pricing before they take effect.
        </p>
      </section>

      <section>
        <h2>5. Third-party platforms and service availability</h2>
        <p>
          Your use of Instagram and Meta services is also subject to their
          separate terms and policies. IgHouse is an independent service and is
          not affiliated with, endorsed by, or sponsored by Meta. We do not
          guarantee uninterrupted availability, delivery of a particular
          message, or any specific business result. Meta may limit access or
          change its APIs, which can affect IgHouse features.
        </p>
      </section>

      <section>
        <h2>6. Suspension and termination</h2>
        <p>
          You may stop using IgHouse and request deletion of your data using
          our <a href="/data-deletion">data deletion instructions</a>. We may
          suspend or terminate access if you materially violate these terms,
          create risk to the service or others, or if required by law. Any
          provisions that by their nature should continue after termination
          will remain in effect.
        </p>
      </section>

      <section>
        <h2>7. Changes and contact</h2>
        <p>
          We may update these terms as the service or applicable requirements
          change. We will post the updated terms here and revise the date
          above. Continued use after a change takes effect means you accept the
          updated terms. Questions about these terms may be sent to{" "}
          <a href="mailto:privacy@ighouse.app">privacy@ighouse.app</a>.
        </p>
      </section>
    </LegalPage>
  );
}
