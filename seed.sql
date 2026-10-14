-- -------------------------------------------------------------
-- TablePlus 26.10.16(794)
--
-- https://tableplus.com/
--
-- Database: file_system_wrapper
-- Generation Time: 2026-09-19 02:56:17.6380
-- -------------------------------------------------------------


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) UNIQUE NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `domains` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `connection_details` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_domains_urls` (`url`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Email / service domains';

CREATE TABLE `files` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `displayed_name_local` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_downloaded` tinyint(1) DEFAULT '1',
  `downloaded_date_time` datetime DEFAULT NULL,
  `is_uploaded_to_destination` tinyint(1) DEFAULT '0',
  `upload_destination` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_date_time` datetime DEFAULT NULL,
  `is_manually_uploaded` tinyint(1) DEFAULT '0',
  `mailbox_id` bigint unsigned DEFAULT NULL,
  `is_soft_deleted` tinyint(1) DEFAULT '0',
  `local_file_location` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_files_mailbox` (`mailbox_id`),
  KEY `idx_files_downloaded` (`is_downloaded`),
  KEY `idx_files_uploaded` (`is_uploaded_to_destination`),
  KEY `idx_files_soft_deleted` (`is_soft_deleted`),
  KEY `idx_files_downloaded_at` (`downloaded_date_time`),
  KEY `idx_files_uploaded_at` (`uploaded_date_time`),
  CONSTRAINT `fk_files_mailbox` FOREIGN KEY (`mailbox_id`) REFERENCES `mailboxes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=481 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Tracked files with upload & soft-delete lifecycle';

CREATE TABLE `mailboxes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `metadata` json DEFAULT NULL,
  `domain_id` bigint unsigned NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email_domain` (`email`,`domain_id`),
  KEY `idx_mailboxes_domain` (`domain_id`),
  KEY `idx_mailboxes_active` (`is_active`),
  CONSTRAINT `fk_mailboxes_domain` FOREIGN KEY (`domain_id`) REFERENCES `domains` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Mailbox accounts linked to a domain';

INSERT INTO `domains` (`id`, `name`, `url`, `description`, `created_at`, `updated_at`) VALUES
(4, 'GMX', 'imap.gmx.net', 'Connect your GMX IMAP mailbox to automatically sync incoming and outgoing email invoices.', '2026-09-03 00:25:58', '2026-09-03 00:27:57'),
(5, 'PayPal', 'www.paypal.com/', 'Generate monthly transaction reports and PDF ledgers from your PayPal business account.', '2026-09-03 00:25:58', '2026-09-03 00:27:57'),
(6, 'Etsy', 'www.etsy.com', 'Automate your Etsy financial ledgers and monthly transaction reports via OAuth.', '2026-09-13 22:18:52', '2026-09-13 22:18:52'),
(8, 'Lexware', 'www.lexware.de', 'Export incoming and outgoing vouchers directly from your Lexoffice accounting software.', '2026-09-13 22:20:43', '2026-09-13 22:20:43'),
(10, 'eBay', 'www.ebay.com', 'Secure drop-zone for processing and routing your eBay monthly invoices.', '2026-09-14 22:05:23', '2026-09-14 22:05:23');

INSERT INTO `files` (`id`, `original_name`, `displayed_name_local`, `is_downloaded`, `downloaded_date_time`, `is_uploaded_to_destination`, `upload_destination`, `uploaded_date_time`, `is_manually_uploaded`, `mailbox_id`, `is_soft_deleted`, `local_file_location`, `created_at`, `updated_at`) VALUES
(329, 'Etsy_Report_2026-09.pdf', 'Etsy_Report_2026-09.pdf', 1, '2026-09-18 11:00:40', 1, 'f9qrq+buchhaltung@portal-bereich.de', '2026-09-19 02:39:44', 0, 7, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Etsy/Sent/Etsy_Report_2026-09.pdf', '2026-09-18 11:00:40', '2026-09-19 02:55:16'),
(330, 'Outgoing_RE1408261_2026-08-14.pdf', 'Outgoing_RE1408261_2026-08-14.pdf', 1, '2026-09-18 11:03:03', 1, 'f9qrq+eingangsrechnungen@portal-bereich.de', '2026-09-19 02:37:55', 0, 12, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Lexoffice/Outgoing/Sent/Outgoing_RE1408261_2026-08-14.pdf', '2026-09-18 11:03:03', '2026-09-19 02:55:16'),
(331, 'Outgoing_RE1408262_2026-08-14.pdf', 'Outgoing_RE1408262_2026-08-14.pdf', 1, '2026-09-18 11:04:19', 1, 'f9qrq+eingangsrechnungen@portal-bereich.de', '2026-09-19 02:37:55', 0, 12, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Lexoffice/Outgoing/Sent/Outgoing_RE1408262_2026-08-14.pdf', '2026-09-18 11:04:19', '2026-09-19 02:55:16'),
(332, 'Outgoing_RE1408263_2026-08-14.pdf', 'Outgoing_RE1408263_2026-08-14.pdf', 1, '2026-09-18 11:04:52', 1, 'f9qrq+eingangsrechnungen@portal-bereich.de', '2026-09-19 02:37:55', 0, 12, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Lexoffice/Outgoing/Sent/Outgoing_RE1408263_2026-08-14.pdf', '2026-09-18 11:04:52', '2026-09-19 02:55:16'),
(333, 'Outgoing_RE1408264_2026-08-14.pdf', 'Outgoing_RE1408264_2026-08-14.pdf', 1, '2026-09-18 11:05:26', 1, 'f9qrq+eingangsrechnungen@portal-bereich.de', '2026-09-19 02:37:55', 0, 12, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Lexoffice/Outgoing/Sent/Outgoing_RE1408264_2026-08-14.pdf', '2026-09-18 11:05:26', '2026-09-19 02:55:16'),
(334, 'Outgoing_RE1408265_2026-08-14.pdf', 'Outgoing_RE1408265_2026-08-14.pdf', 1, '2026-09-18 11:06:06', 1, 'f9qrq+eingangsrechnungen@portal-bereich.de', '2026-09-19 02:37:55', 0, 12, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Lexoffice/Outgoing/Sent/Outgoing_RE1408265_2026-08-14.pdf', '2026-09-18 11:06:06', '2026-09-19 02:55:16'),
(335, 'Outgoing_RE1408261_2026-08-26.pdf', 'Outgoing_RE1408261_2026-08-26.pdf', 1, '2026-09-18 11:06:41', 1, 'f9qrq+eingangsrechnungen@portal-bereich.de', '2026-09-19 02:37:55', 0, 12, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Lexoffice/Outgoing/Sent/Outgoing_RE1408261_2026-08-26.pdf', '2026-09-18 11:06:41', '2026-09-19 02:55:16'),
(336, 'PayPal_Report_2026-09.pdf', 'PayPal_Report_2026-09.pdf', 1, '2026-09-18 11:09:33', 1, 'f9qrq+buchhaltung@portal-bereich.de', '2026-09-19 02:39:21', 0, 9, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/PayPal/Betonwaschbecken/Sent/PayPal_Report_2026-09.pdf', '2026-09-18 11:09:33', '2026-09-19 02:55:16'),
(337, 'PayPal_Report_2026-09.pdf', 'PayPal_Report_2026-09.pdf', 1, '2026-09-18 11:10:38', 1, 'f9qrq+buchhaltung@portal-bereich.de', '2026-09-19 02:39:40', 0, 6, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/PayPal/Sent/FredFeuer/PayPal_Report_2026-09.pdf', '2026-09-18 11:10:38', '2026-09-19 02:55:16'),
(456, 'Rechnung_U7356461.pdf', 'Rechnung_U7356461.pdf', 1, '2026-09-19 02:12:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/01/Rechnung_U7356461.pdf', '2026-09-19 02:12:36', '2026-09-19 02:51:46'),
(457, 'Rechnung_U7302149.pdf', 'Rechnung_U7302149.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/01/Rechnung_U7302149.pdf', '2026-09-19 02:12:36', '2026-09-19 02:51:46'),
(458, 'RS31812_2026-09-01_RENE_30025.pdf', 'RS31812_2026-09-01_RENE_30025.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/01/RS31812_2026-09-01_RENE_30025.pdf', '2026-09-19 02:12:36', '2026-09-19 02:51:46'),
(459, 'invoice_654615.pdf', 'invoice_654615.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/03/invoice_654615.pdf', '2026-09-19 02:12:36', '2026-09-19 02:51:46'),
(460, 'invoice_654615.pdf', 'invoice_654615.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/03/invoice_654615.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(461, 'F1784968.pdf', 'F1784968.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/04/F1784968.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(462, 'F1784969.pdf', 'F1784969.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/04/F1784969.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(463, 'Rechnung RE809261_08.09.2026.pdf', 'Rechnung RE809261_08.09.2026.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/08/Rechnung RE809261_08.09.2026.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(464, 'Rechnung 9102075656.PDF', 'Rechnung 9102075656.PDF', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/09/Rechnung 9102075656.PDF', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(465, 'Rechnung 873722026.pdf', 'Rechnung 873722026.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/09/Rechnung 873722026.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(466, 'Rechnung 16299.pdf', 'Rechnung 16299.pdf', 1, '2026-09-19 02:12:37', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/09/Rechnung 16299.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(467, 'F1786574.pdf', 'F1786574.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/11/F1786574.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(468, 'F1786577.pdf', 'F1786577.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/11/F1786577.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(469, 'F1786584.pdf', 'F1786584.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/11/F1786584.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(470, 'F1786589.pdf', 'F1786589.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/11/F1786589.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(471, 'F1786788.pdf', 'F1786788.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/11/F1786788.pdf', '2026-09-19 02:12:37', '2026-09-19 02:51:46'),
(472, 'Rechnung AR26-03747.pdf', 'Rechnung AR26-03747.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/16/Rechnung AR26-03747.pdf', '2026-09-19 02:12:38', '2026-09-19 02:51:46'),
(473, 'Rechnung 874922026.pdf', 'Rechnung 874922026.pdf', 1, '2026-09-19 02:12:38', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 1, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/Betonwaschbecken/2026/September/18/Rechnung 874922026.pdf', '2026-09-19 02:12:38', '2026-09-19 02:51:46'),
(474, 'Rechnung (200296520).pdf', 'Rechnung (200296520).pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/02/Rechnung (200296520).pdf', '2026-09-19 02:13:35', '2026-09-19 02:51:46'),
(475, 'invoice_RE202676203_2026-09-02.pdf', 'invoice_RE202676203_2026-09-02.pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/02/invoice_RE202676203_2026-09-02.pdf', '2026-09-19 02:13:35', '2026-09-19 02:51:46'),
(476, 'Rechnung_RG-119199.pdf', 'Rechnung_RG-119199.pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/04/Rechnung_RG-119199.pdf', '2026-09-19 02:13:35', '2026-09-19 02:51:46'),
(477, 'Rechnung (200297221).pdf', 'Rechnung (200297221).pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/08/Rechnung (200297221).pdf', '2026-09-19 02:13:35', '2026-09-19 02:51:46'),
(478, 'Rechnung (200297229).pdf', 'Rechnung (200297229).pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/08/Rechnung (200297229).pdf', '2026-09-19 02:13:35', '2026-09-19 02:51:46'),
(479, 'Rechnung (200297573).pdf', 'Rechnung (200297573).pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/11/Rechnung (200297573).pdf', '2026-09-19 02:13:35', '2026-09-19 02:51:46'),
(480, 'Rechnung (200297737).pdf', 'Rechnung (200297737).pdf', 1, '2026-09-19 02:13:36', 1, 'f9qrq+ausgangsrechnungen@portal-bereich.de', '2026-09-19 02:13:48', 0, 2, 0, 'C:/Users/Rene/Desktop/Neuer Ordner/n8n-workflow-main/n8n-workflow-main/downloads/Mailboxes/FredFeuer/2026/September/14/Rechnung (200297737).pdf', '2026-09-19 02:13:36', '2026-09-19 02:51:46');

INSERT INTO `mailboxes` (`id`, `name`, `email`, `is_active`, `metadata`, `domain_id`, `created_at`, `updated_at`) VALUES
(1, 'Waschbeckenmanufaktur', 'info@betonwaschbecken.de', 1, NULL, 4, '2026-09-03 09:54:44', '2026-09-03 09:54:44'),
(2, 'FredFeuer', 'info@fredfeuer.de', 1, NULL, 4, '2026-09-03 09:55:26', '2026-09-03 09:55:26'),
(6, 'FredFeuer', 'info@fredfeuer.de', 1, NULL, 5, '2026-09-13 22:54:41', '2026-09-13 22:54:41'),
(7, 'Etsy', 'default@etsy', 1, NULL, 6, '2026-09-14 21:30:12', '2026-09-18 22:38:52'),
(9, 'Waschbeckenmanufaktur', 'info@betonwaschbecken.de', 1, NULL, 5, '2026-09-18 10:50:47', '2026-09-18 10:50:47'),
(10, 'Incoming', 'default@lexware.incoming', 1, NULL, 8, '2026-09-18 10:51:52', '2026-09-18 22:37:50'),
(12, 'Outgoing', 'default@lexware.outgoing', 1, NULL, 8, '2026-09-18 10:52:23', '2026-09-18 22:38:10'),
(13, 'eBay', 'default@ebay', 1, NULL, 10, '2026-09-18 10:52:56', '2026-09-18 22:38:38');



/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;