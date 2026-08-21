CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`stamp_id` text NOT NULL,
	`price_pence` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`stamp_id`) REFERENCES `stamps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`stripe_session_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`customer_email` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stamp_images` (
	`id` text PRIMARY KEY NOT NULL,
	`stamp_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`alt_text` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`stamp_id`) REFERENCES `stamps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stamp_tags` (
	`stamp_id` text NOT NULL,
	`tag` text NOT NULL,
	PRIMARY KEY(`stamp_id`, `tag`),
	FOREIGN KEY (`stamp_id`) REFERENCES `stamps`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `stamps` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`country` text DEFAULT 'Great Britain' NOT NULL,
	`era` text NOT NULL,
	`issue_year` integer,
	`issue_year_end` integer,
	`sg_number` text NOT NULL,
	`condition` text NOT NULL,
	`grade` text,
	`price_pence` integer NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'available' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
