# Telepathy Looker Studio Connector

A simple, open-source connector that transforms your Looker Studio reports from static dashboards into interactive, stateful applications. Persist user inputs, trigger webhooks, and create dynamic, collaborative experiences.

  - [What is it?](#what-is-it)
  - [Installation & Setup](#installation--setup)
  - [How to Use It](#how-to-use-it)
  - [Use Cases: Transforming Looker Studio](#use-cases-transforming-looker-studio)


## What is it?

Looker Studio reports are typically isolated, with user interactions living only within the viewer’s browser session. This connector breaks that limitation.

It provides a "global parameter" functionality, allowing you to capture user input directly within a report, log it to a designated Google Sheet, and optionally trigger external automations via webhooks. This turns Looker Studio from a one-way visualization tool into a two-way interactive platform.

## Installation & Setup

Follow these steps to deploy your own instance of the connector.

### 1. Create the Apps Script Project
* Go to [script.google.com](https://script.google.com) and create a **New project**.

### 2. Add the Script Files
You will add three files from this repository to your Apps Script project.

* **`Code.gs`**: Copy the entire contents of the `Code.gs` file from this repository and paste it into the default `Code.gs` file in your Apps Script project.
* **`auth.gs`**: In Apps Script, click the **+** icon next to "Files" and select **Script**. Name the new file `auth.gs`. Copy the contents of `auth.gs` from the repository and paste it into this new file.
* **`appsscript.json`**:
    * Click the **Project Settings** (⚙️) icon on the left.
    * Check the box for **Show "appsscript.json" manifest file in editor**.
    * Return to the **Editor** (✏️). Click on the newly visible `appsscript.json` file and replace its contents with the code from the `appsscript.json` file in this repository.

### 3. Deploy and Authorize the Connector
* Click the **Deploy** button and select **New deployment**.
* Click the **Select type** (⚙️) icon. You will see several deployment options.
    * **Choose a deployment type.** For most users, **Library** is the best choice as it **does not require you to set up a Google Cloud Platform (GCP) project**. Other types like 'Web app' or 'Add-on' will also work but may ask for a GCP project number.
* Enter a name or description for your deployment (e.g., "v1") and click **Deploy**.
* In the success window, find the **Data Studio Add-on URL**.
* **Copy the full URL** and go to it in a new browser tab.
    
* You will be guided through Google's authorization flow. You must **grant permission** for the script to manage your Spreadsheets (to log data) and connect to external services (to call webhooks).

---

## How to Use It

Once authorized, you will land on the connector's configuration page in Looker Studio.

1.  **Create a Google Sheet**: Have a blank Google Sheet ready (you can create one at [sheet.new](https://sheet.new)).
2.  **Configure the Connector**:
    * **Google Sheet URL**: Paste the full URL of your Google Sheet.
    * **Sheet Name**: Enter the name of the specific sheet where data will be logged (e.g., `Sheet1`).
    * **Webhook URL (Optional)**: If you want to trigger an automation (like a Slack notification or a CRM update), paste the webhook endpoint URL here.
    * **IMPORTANT**: Make sure you **check both boxes** to allow the parameters to be modified in the final report. This is required for the connector to be interactive.
    

3.  **Connect and Create Report**:
    * Check the box for **Use report template for new reports** to get started with a pre-built layout.
    * Click **Connect** in the top right, and then **Create Report**.

You now have an interactive report! Any value you enter into the **`input_parameter`** field and submit by changing the **`Send Status`** to **`send`** will instantly appear in your Google Sheet with a timestamp and be sent to your webhook.

---

## Use Cases: Transforming Looker Studio

This connector unlocks capabilities that turn Looker Studio into a powerful, interactive hub for your team.

### Dynamic Updates Across Reports
Update benchmarks, parameters, and other targets dynamically across all reports without having to adjust each one manually. This updates everything from calculations to conditional formatting and comparisons.

### Collaborate without Leaving the Report
Add a chat-like feature where stakeholders can leave notes, comments, or feedback directly within the dashboard. These comments are logged and visible to others, eliminating the need for emails or PDF annotations.

### Communicate Changes Across All Company Reports
Set a new target for cost-per-acquisition (CPA) in one report and have that value reflected across all relevant reports for the entire organization, ensuring everyone is working with the latest information.

### Interactive Decision-Making Tools
Go beyond one-way data visualization. Execute actions like adding a new task to your project management tool or changing the status of a lead in your CRM directly from within the report.

### Create Notification and Action Triggers
Create triggers based on viewers' interactions. Get an email notification when a team member validates a data set, or send a new value directly to your database via an API call when a parameter is updated.

### Data Validation and Feedback Workflow
Mark your Looker Studio reports as “under review” or “validated,” logging the timestamp and reviewer details to a central sheet. This creates a clear and consistent data quality workflow for your entire organization.

