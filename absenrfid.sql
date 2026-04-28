-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Apr 16, 2026 at 05:17 AM
-- Server version: 8.4.3
-- PHP Version: 8.3.16

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `absenrfid`
--

-- --------------------------------------------------------

--
-- Table structure for table `app_settings`
--

CREATE TABLE `app_settings` (
  `id` bigint UNSIGNED NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `app_settings`
--

INSERT INTO `app_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES
(1, 'institution_name', 'SMAIT Ulil Albab', '2026-01-02 22:18:14', '2026-01-04 20:08:31'),
(2, 'default_tap_delay', '300', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(3, 'esp_api_key', 'Opkzo68p2o1tRZpM4LG1HkKEsFVJikDf', '2026-01-02 22:18:14', '2026-01-02 22:52:23'),
(4, 'fonnte_api_token', 'tUi9xzDBiwqgnCFsRhZN', '2026-01-02 22:38:43', '2026-01-02 22:38:43'),
(5, 'principal_phone', '6285805387401', '2026-01-02 22:38:43', '2026-01-02 22:38:43'),
(6, 'institution_logo', 'logos/sdF5zwSb2iaN60aC5l60Oqh66iKluz0RB6gD5JUZ.png', '2026-01-04 03:38:17', '2026-01-08 08:44:21');

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `esp_device_id` bigint UNSIGNED DEFAULT NULL,
  `recorded_by` bigint UNSIGNED DEFAULT NULL,
  `tap_type` enum('in','out') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in',
  `tapped_at` timestamp NOT NULL,
  `wa_sent` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`id`, `student_id`, `esp_device_id`, `recorded_by`, `tap_type`, `tapped_at`, `wa_sent`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, 'in', '2026-01-02 23:02:32', 0, '2026-01-02 23:02:32', '2026-01-02 23:02:32'),
(2, 1, 1, NULL, 'out', '2026-01-02 23:39:08', 0, '2026-01-02 23:39:08', '2026-01-02 23:39:08'),
(3, 2, 1, NULL, 'in', '2026-01-02 23:41:58', 0, '2026-01-02 23:41:58', '2026-01-02 23:41:58'),
(4, 1, 1, NULL, 'in', '2026-01-02 23:49:43', 0, '2026-01-02 23:49:43', '2026-01-02 23:49:43'),
(5, 2, 1, NULL, 'out', '2026-01-02 23:51:25', 1, '2026-01-02 23:51:25', '2026-01-02 23:51:26'),
(6, 1, 1, NULL, 'out', '2026-01-07 03:27:44', 1, '2026-01-07 03:27:44', '2026-01-07 03:27:44'),
(7, 1, 1, NULL, 'in', '2026-01-07 10:30:57', 1, '2026-01-07 10:30:57', '2026-01-07 10:30:57');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Reguler', 'Siswa reguler', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(2, 'Beasiswa', 'Siswa penerima beasiswa', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(3, 'Full Day', NULL, '2026-01-03 00:46:58', '2026-01-03 00:46:58');

-- --------------------------------------------------------

--
-- Table structure for table `classes`
--

CREATE TABLE `classes` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `major` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `classes`
--

INSERT INTO `classes` (`id`, `name`, `grade`, `major`, `created_at`, `updated_at`) VALUES
(1, 'X RPL 1', 'X', 'RPL', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(2, 'X RPL 2', 'X', 'RPL', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(3, 'XI RPL 1', 'XI', 'RPL', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(4, 'XI RPL 2', 'XI', 'RPL', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(5, 'XII RPL 1', 'XII', 'RPL', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(6, 'XII RPL 2', 'XII', 'RPL', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(8, 'X TKJ 1', NULL, NULL, '2026-01-05 19:32:06', '2026-01-05 19:32:06');

-- --------------------------------------------------------

--
-- Table structure for table `esp_devices`
--

CREATE TABLE `esp_devices` (
  `id` bigint UNSIGNED NOT NULL,
  `device_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_id` bigint UNSIGNED DEFAULT NULL,
  `type` enum('gate_in','gate_out','classroom') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'gate_in',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `tap_delay_seconds` int NOT NULL DEFAULT '300',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `esp_devices`
--

INSERT INTO `esp_devices` (`id`, `device_code`, `name`, `location_id`, `type`, `is_active`, `tap_delay_seconds`, `created_at`, `updated_at`) VALUES
(1, 'ESP32-GERBANG', 'GERBANG', 1, 'gate_in', 1, 300, '2026-01-02 23:01:12', '2026-01-02 23:01:12');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `locations`
--

CREATE TABLE `locations` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `locations`
--

INSERT INTO `locations` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Gerbang Utama', 'Gerbang masuk utama sekolah', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(2, 'Gerbang Belakang', 'Gerbang belakang sekolah', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(3, 'Ruang Kelas X RPL 1', 'Kelas X RPL 1', '2026-01-02 22:18:14', '2026-01-02 22:18:14'),
(4, 'Ruang Kelas XI RPL 1', 'Kelas XI RPL 1', '2026-01-02 22:18:14', '2026-01-02 22:18:14');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '2014_10_12_000000_create_users_table', 1),
(2, '2014_10_12_100000_create_password_resets_table', 1),
(3, '2019_08_19_000000_create_failed_jobs_table', 1),
(4, '2019_12_14_000001_create_personal_access_tokens_table', 1),
(5, '2024_01_03_000001_create_user_settings_table', 1),
(6, '2024_01_03_000002_create_categories_table', 1),
(7, '2024_01_03_000003_create_classes_table', 1),
(8, '2024_01_03_000004_create_students_table', 1),
(9, '2024_01_03_000005_create_parents_table', 1),
(10, '2024_01_03_000006_create_teachers_table', 1),
(11, '2024_01_03_000007_create_locations_table', 1),
(12, '2024_01_03_000008_create_esp_devices_table', 1),
(13, '2024_01_03_000009_create_attendance_logs_table', 1),
(14, '2024_01_03_000010_create_teacher_attendance_logs_table', 1),
(15, '2024_01_03_000011_create_app_settings_table', 1),
(16, '2024_01_03_000012_create_notification_logs_table', 1),
(17, '2024_01_04_000001_add_photo_to_parents_table', 2),
(18, '2026_01_08_115900_add_photo_to_parents_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `notification_logs`
--

CREATE TABLE `notification_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('student','teacher') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `status` enum('pending','sent','failed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `response` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_logs`
--

INSERT INTO `notification_logs` (`id`, `phone`, `message`, `type`, `status`, `response`, `created_at`, `updated_at`) VALUES
(1, '6285156670861', '📍 *Notifikasi Kehadiran*\n\nAnanda *Didit Febry* telah *MASUK* sekolah pada:\n📅 03 January 2026\n⏰ 06:02 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'failed', 'cURL error 77: error setting certificate file: D:\\Projects\\Laragon-installer\\7.0-W64\\etc\\ssl\\cacert.pem (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://api.fonnte.com/send', '2026-01-02 23:02:33', '2026-01-02 23:02:33'),
(2, '6285156670861', '📍 *Notifikasi Kehadiran*\n\nAnanda *Didit Febry* telah *KELUAR* sekolah pada:\n📅 03 January 2026\n⏰ 06:39 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'failed', 'cURL error 77: error setting certificate file: D:\\Projects\\Laragon-installer\\7.0-W64\\etc\\ssl\\cacert.pem (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://api.fonnte.com/send', '2026-01-02 23:39:08', '2026-01-02 23:39:08'),
(3, '6285805387401', '📍 *Notifikasi Kehadiran*\n\nAnanda *M RIzki Nabawi* telah *MASUK* sekolah pada:\n📅 03 January 2026\n⏰ 06:41 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'failed', 'cURL error 77: error setting certificate file: D:\\Projects\\Laragon-installer\\7.0-W64\\etc\\ssl\\cacert.pem (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://api.fonnte.com/send', '2026-01-02 23:41:58', '2026-01-02 23:41:58'),
(4, '6285156670861', '📍 *Notifikasi Kehadiran*\n\nAnanda *Didit Febry* telah *MASUK* sekolah pada:\n📅 03 January 2026\n⏰ 06:49 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'failed', 'cURL error 77: error setting certificate file: D:\\Projects\\Laragon-installer\\7.0-W64\\etc\\ssl\\cacert.pem (see https://curl.haxx.se/libcurl/c/libcurl-errors.html) for https://api.fonnte.com/send', '2026-01-02 23:49:43', '2026-01-02 23:49:43'),
(5, '6285805387401', '📍 *Notifikasi Kehadiran*\n\nAnanda *M RIzki Nabawi* telah *KELUAR* sekolah pada:\n📅 03 January 2026\n⏰ 06:51 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'sent', '{\"detail\":\"success! message in queue\",\"id\":[137547248],\"process\":\"pending\",\"quota\":{\"6285156670861\":{\"details\":\"deduced from total quota\",\"quota\":999,\"remaining\":998,\"used\":1}},\"requestid\":319102065,\"status\":true,\"target\":[\"6285805387401\"]}', '2026-01-02 23:51:26', '2026-01-02 23:51:26'),
(6, '6285156670861', '📍 *Notifikasi Kehadiran*\n\nAnanda *Didit Febry* telah *KELUAR* sekolah pada:\n📅 07 January 2026\n⏰ 10:27 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'sent', '{\"detail\":\"success! message in queue\",\"id\":[138089218],\"process\":\"pending\",\"quota\":{\"6285156670861\":{\"details\":\"deduced from total quota\",\"quota\":996,\"remaining\":995,\"used\":1}},\"requestid\":325896145,\"status\":true,\"target\":[\"6285156670861\"]}', '2026-01-07 03:27:44', '2026-01-07 03:27:44'),
(7, '6285156670861', '📍 *Notifikasi Kehadiran*\n\nAnanda *Didit Febry* telah *MASUK* sekolah pada:\n📅 07 January 2026\n⏰ 17:30 WIB\n📍 Gerbang Utama\n\n_SMAIT Ulil Albab_', 'student', 'sent', '{\"detail\":\"success! message in queue\",\"id\":[138089524],\"process\":\"pending\",\"quota\":{\"6285156670861\":{\"details\":\"deduced from total quota\",\"quota\":995,\"remaining\":994,\"used\":1}},\"requestid\":325899962,\"status\":true,\"target\":[\"6285156670861\"]}', '2026-01-07 10:30:57', '2026-01-07 10:30:57');

-- --------------------------------------------------------

--
-- Table structure for table `parents`
--

CREATE TABLE `parents` (
  `id` bigint UNSIGNED NOT NULL,
  `student_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `relationship` enum('ayah','ibu','wali') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'wali',
  `receive_notification` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `parents`
--

INSERT INTO `parents` (`id`, `student_id`, `name`, `phone`, `photo`, `relationship`, `receive_notification`, `created_at`, `updated_at`) VALUES
(1, 1, 'Adit', '6285156670861', NULL, 'ayah', 1, '2026-01-02 22:33:07', '2026-01-03 07:06:21'),
(2, 2, 'Didit 4', '6285805387401', NULL, 'ayah', 1, '2026-01-02 23:41:34', '2026-01-04 21:08:24'),
(35, 34, 'Budi Santoso', '628123456789', 'photos/parents/VRiSalLcSoqxsKyPyQ63Ph5tU0kwwulssQOKioPF.jpg', 'ayah', 1, '2026-01-06 02:19:45', '2026-01-08 05:00:16'),
(36, 35, 'Dewi Rahayu', '628987654321', NULL, 'ibu', 1, '2026-01-06 02:19:45', '2026-01-06 02:19:45');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

INSERT INTO `personal_access_tokens` (`id`, `tokenable_type`, `tokenable_id`, `name`, `token`, `abilities`, `last_used_at`, `created_at`, `updated_at`) VALUES
(11, 'App\\Models\\User', 1, 'auth-token', '18e1596be916d3d8ebd76d4d40d580f3c04461d96068f21b0755879202062a73', '[\"*\"]', '2026-01-03 00:27:40', '2026-01-03 00:09:38', '2026-01-03 00:27:40'),
(18, 'App\\Models\\User', 1, 'auth-token', '891a74ecc456a1a6446cea812b8bc4bd9a9b0a9c1bdbf4843c5a20dc87371846', '[\"*\"]', '2026-01-03 07:52:32', '2026-01-03 07:51:49', '2026-01-03 07:52:32'),
(22, 'App\\Models\\User', 1, 'auth-token', '49160e98d78c2ea18b5097cc19b5bb18c9e59e8db9df19d4e9877d69e10ec694', '[\"*\"]', '2026-01-05 20:20:52', '2026-01-04 20:02:17', '2026-01-05 20:20:52'),
(23, 'App\\Models\\User', 1, 'auth-token', 'eab8aec6a5ff29cf267a18eb0744484b5c7e26c8eb7cfb104eaefe4ea0795a39', '[\"*\"]', '2026-01-05 20:25:39', '2026-01-04 20:03:01', '2026-01-05 20:25:39'),
(27, 'App\\Models\\User', 1, 'auth-token', '2813f6a474a0864cbc7f2c441c0a6766125a9f1e21cdf9c77c20940aca6e02cf', '[\"*\"]', '2026-01-07 10:32:30', '2026-01-07 03:19:52', '2026-01-07 10:32:30'),
(30, 'App\\Models\\User', 1, 'auth-token', '51f84302026f634b0c6abbe7b7dc380934a2f6d90a623c0e335af582f4cd7bcd', '[\"*\"]', '2026-01-08 10:43:57', '2026-01-08 08:50:07', '2026-01-08 10:43:57'),
(31, 'App\\Models\\User', 1, 'auth-token', 'b6e63d2ca7ead60204d6e25199c978a72149381e4efadbc718eeb82da3eb8087', '[\"*\"]', '2026-01-08 13:35:16', '2026-01-08 13:35:14', '2026-01-08 13:35:16'),
(32, 'App\\Models\\User', 1, 'auth-token', 'ce564ed29cb72c61f6739a6a9626b81f2e563fbb09a21afa2a899dc0446e1434', '[\"*\"]', '2026-01-08 13:36:37', '2026-01-08 13:36:12', '2026-01-08 13:36:37');

-- --------------------------------------------------------

--
-- Table structure for table `students`
--

CREATE TABLE `students` (
  `id` bigint UNSIGNED NOT NULL,
  `rfid_uid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nis` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `class_id` bigint UNSIGNED NOT NULL,
  `category_id` bigint UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `students`
--

INSERT INTO `students` (`id`, `rfid_uid`, `nis`, `name`, `photo`, `class_id`, `category_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '97D040B5', '12211221', 'Didit Febry', 'photos/students/oTdOV29nzhzd7mgZxpCH6eMlW47qeBKiJx2Nao8f.jpg', 1, 1, 1, '2026-01-02 22:32:31', '2026-01-08 04:47:10'),
(2, 'AAC77982', '121111', 'M RIzki Nabawi', NULL, 1, 1, 1, '2026-01-02 23:41:17', '2026-01-02 23:41:17'),
(34, 'A1B2C3D4', '12345', 'Ahmad Rizki', NULL, 1, 1, 1, '2026-01-06 02:19:45', '2026-01-06 02:19:45'),
(35, 'E5F6G7H8', '12346', 'Siti Nurhaliza', NULL, 2, 3, 1, '2026-01-06 02:19:45', '2026-01-06 02:19:45');

-- --------------------------------------------------------

--
-- Table structure for table `teachers`
--

CREATE TABLE `teachers` (
  `id` bigint UNSIGNED NOT NULL,
  `rfid_uid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nip` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `teachers`
--

INSERT INTO `teachers` (`id`, `rfid_uid`, `nip`, `name`, `phone`, `photo`, `is_active`, `created_at`, `updated_at`) VALUES
(1, '0909090909', '21231222', 'Ahmad', '08676677666', 'photos/teachers/JMBokSYdG3siYXOkcLu8Kp24Bp8xfTd3dRJLodVb.jpg', 1, '2026-01-06 04:15:36', '2026-01-08 13:36:25');

-- --------------------------------------------------------

--
-- Table structure for table `teacher_attendance_logs`
--

CREATE TABLE `teacher_attendance_logs` (
  `id` bigint UNSIGNED NOT NULL,
  `teacher_id` bigint UNSIGNED NOT NULL,
  `esp_device_id` bigint UNSIGNED DEFAULT NULL,
  `tap_type` enum('in','out') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in',
  `tapped_at` timestamp NOT NULL,
  `wa_sent` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint UNSIGNED NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('super_admin','kepala_sekolah','staff_admin','guru_piket','operator') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'operator',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `photo`, `role`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Muhamad Sahrul Nizan', 'admin@sekolah.com', NULL, '$2y$10$QF2wqMmjLp4/li0/88Psm.xPntUQSzkrBN7VP274x8jVinn6cn8Te', 'photos/users/ISyBHUKqG164amCS2GJ5co7sAriqt3DiLjeMwF8P.jpg', 'super_admin', NULL, '2026-01-02 22:18:14', '2026-01-08 08:54:11'),
(2, 'Kepala Sekolah', 'kepsek@sekolah.com', NULL, '$2y$10$k/UT2iSUwX9ifFRErERCSug0/.l/Csi3SX/MruvaPwVeBTiSktTV6', NULL, 'kepala_sekolah', NULL, '2026-01-02 22:18:14', '2026-01-03 01:04:20'),
(3, 'guru', 'guru@gmail.com', NULL, '$2y$10$ToVi7nUdlIsMhfYnf0m1O.Yy/LYffdDpIL2oO6xK0yZmU6ZdZJtlG', 'photos/users/Y8yXKAtXMR84VhKq9BJ1Ag3pCRKzgKOlkdM88cSz.jpg', 'guru_piket', NULL, '2026-01-07 03:13:35', '2026-01-08 04:41:14'),
(4, 'Dede Nurdiansyah', 'dede@gmail.com', NULL, '$2y$10$ludG3VaYFxgt8bZCXMu2rO5WWOQ6l94mPNYMwEsdtf/o7A5UAeDBC', 'photos/users/ZFaIRSZSb4sEYcol812l1MYnWboBmXW5QUSayLOw.jpg', 'operator', NULL, '2026-01-08 04:38:30', '2026-01-08 04:38:30');

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `id` bigint UNSIGNED NOT NULL,
  `user_id` bigint UNSIGNED NOT NULL,
  `theme` enum('light','dark') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'light',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `app_settings`
--
ALTER TABLE `app_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `app_settings_key_unique` (`key`);

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `attendance_logs_esp_device_id_foreign` (`esp_device_id`),
  ADD KEY `attendance_logs_recorded_by_foreign` (`recorded_by`),
  ADD KEY `attendance_logs_student_id_tapped_at_index` (`student_id`,`tapped_at`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `classes`
--
ALTER TABLE `classes`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `esp_devices`
--
ALTER TABLE `esp_devices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `esp_devices_device_code_unique` (`device_code`),
  ADD KEY `esp_devices_location_id_foreign` (`location_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `locations`
--
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notification_logs_status_created_at_index` (`status`,`created_at`);

--
-- Indexes for table `parents`
--
ALTER TABLE `parents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `parents_student_id_foreign` (`student_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD KEY `password_resets_email_index` (`email`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`);

--
-- Indexes for table `students`
--
ALTER TABLE `students`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `students_rfid_uid_unique` (`rfid_uid`),
  ADD UNIQUE KEY `students_nis_unique` (`nis`),
  ADD KEY `students_class_id_foreign` (`class_id`),
  ADD KEY `students_category_id_foreign` (`category_id`);

--
-- Indexes for table `teachers`
--
ALTER TABLE `teachers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `teachers_rfid_uid_unique` (`rfid_uid`),
  ADD UNIQUE KEY `teachers_nip_unique` (`nip`);

--
-- Indexes for table `teacher_attendance_logs`
--
ALTER TABLE `teacher_attendance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `teacher_attendance_logs_esp_device_id_foreign` (`esp_device_id`),
  ADD KEY `teacher_attendance_logs_teacher_id_tapped_at_index` (`teacher_id`,`tapped_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_settings_user_id_foreign` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `app_settings`
--
ALTER TABLE `app_settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `classes`
--
ALTER TABLE `classes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `esp_devices`
--
ALTER TABLE `esp_devices`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `locations`
--
ALTER TABLE `locations`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `notification_logs`
--
ALTER TABLE `notification_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `parents`
--
ALTER TABLE `parents`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `students`
--
ALTER TABLE `students`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `teachers`
--
ALTER TABLE `teachers`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `teacher_attendance_logs`
--
ALTER TABLE `teacher_attendance_logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `user_settings`
--
ALTER TABLE `user_settings`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD CONSTRAINT `attendance_logs_esp_device_id_foreign` FOREIGN KEY (`esp_device_id`) REFERENCES `esp_devices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_logs_recorded_by_foreign` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `attendance_logs_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `esp_devices`
--
ALTER TABLE `esp_devices`
  ADD CONSTRAINT `esp_devices_location_id_foreign` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `parents`
--
ALTER TABLE `parents`
  ADD CONSTRAINT `parents_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `students`
--
ALTER TABLE `students`
  ADD CONSTRAINT `students_category_id_foreign` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `students_class_id_foreign` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `teacher_attendance_logs`
--
ALTER TABLE `teacher_attendance_logs`
  ADD CONSTRAINT `teacher_attendance_logs_esp_device_id_foreign` FOREIGN KEY (`esp_device_id`) REFERENCES `esp_devices` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `teacher_attendance_logs_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
