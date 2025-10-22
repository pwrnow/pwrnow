# pyright: reportMissingImports=false
from __future__ import annotations
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import requests
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandParser
from django.utils.dateparse import parse_datetime
from django.conf import settings  # noqa: F401  - may be useful if defaults are restored later

from core.models import Category, Event, Organization, Tag
from django.utils.dateparse import parse_date
from users.models import User


DEFAULT_TIMEOUT_SECONDS = 60


@dataclass
class RemoteCategory:
    slug: str
    name_pl: Optional[str] = None
    name_en: Optional[str] = None


@dataclass
class RemoteOrganization:
    slug: str
    name: str
    image_url: Optional[str]


@dataclass
class RemoteEvent:
    slug: str
    title_pl: Optional[str]
    title_en: Optional[str]
    description_pl: Optional[str]
    description_en: Optional[str]
    starts_at: str
    ends_at: str
    location: Optional[str]
    url: Optional[str]
    verified: bool
    aspect_ratio: Optional[str]
    category_slug: Optional[str]
    organization_slug: Optional[str]
    image_url: Optional[str]
    publication_date: Optional[str] = None
    verified_at: Optional[str] = None
    verified_by_username: Optional[str] = None
    tags: Optional[List[str]] = None


class Command(BaseCommand):
    help = (
        "Import data (categories, organizations with images, and events with images) "
        "from a remote API into the local database. Configurable via --api-url."
    )

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument(
            "--api-url",
            dest="api_url",
            type=str,
            default="https://api.pwrnow.pl/",
            help=(
                "Base API URL without version path. "
                "Defaults to https://api.pwrnow.pl/."
            ),
        )
        parser.add_argument(
            "--api-version",
            dest="api_version",
            type=str,
            default="v1",
            help="API version segment (without slashes). Defaults to 'v1'.",
        )
        parser.add_argument(
            "--only",
            dest="only",
            choices=["categories", "organizations", "events"],
            nargs="*",
            help="Import only the specified resources (defaults to all).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be imported without writing to the database or downloading images.",
        )
        parser.add_argument(
            "--force-images",
            action="store_true",
            help="Re-download and overwrite images for organizations and events even if already present.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Limit number of events to import (useful for testing).",
        )
        parser.add_argument(
            "--allow-notifications",
            action="store_true",
            help="Allow sending notifications/Discord during import (default: suppressed).",
        )

    # ---------------
    # Helper methods
    # ---------------
    def _get(self, base_api_url: str, path: str, lang: Optional[str] = None) -> dict:
        url = f"{base_api_url.rstrip('/')}{path}"
        params = {}
        if lang:
            params["lang"] = lang
        resp = requests.get(url, params=params, timeout=DEFAULT_TIMEOUT_SECONDS)
        resp.raise_for_status()
        return resp.json()

    def _download_image(self, url: str) -> Tuple[str, ContentFile]:
        response = requests.get(url, timeout=DEFAULT_TIMEOUT_SECONDS)
        response.raise_for_status()
        # Derive a reasonable filename from URL
        filename = url.split("?")[0].rstrip("/").split("/")[-1] or "image"
        content = ContentFile(response.content)
        return filename, content

    # ---------------------
    # Fetch remote datasets
    # ---------------------
    def fetch_categories(self, api_url: str) -> Dict[str, RemoteCategory]:
        # Fetch in both languages to populate translations
        by_slug: Dict[str, RemoteCategory] = {}
        for lang in ("pl", "en"):
            data = self._get(api_url, "/categories/", lang=lang)
            for item in data:
                slug = item.get("slug")
                name = item.get("name")
                if not slug:
                    continue
                if slug not in by_slug:
                    by_slug[slug] = RemoteCategory(slug=slug)
                if lang == "pl":
                    by_slug[slug].name_pl = name
                else:
                    by_slug[slug].name_en = name
        return by_slug

    def fetch_organizations(self, api_url: str) -> Dict[str, RemoteOrganization]:
        data = self._get(api_url, "/organizations/")
        result: Dict[str, RemoteOrganization] = {}
        for item in data:
            slug = item.get("slug")
            name = item.get("name")
            image_url = item.get("image_url")
            if not slug:
                continue
            result[slug] = RemoteOrganization(slug=slug, name=name or slug, image_url=image_url)
        return result

    def fetch_events(self, api_url: str, limit: Optional[int] = None) -> Dict[str, RemoteEvent]:
        # Fetch twice to populate translations
        events_pl = self._get(api_url, "/events/", lang="pl")
        events_en = self._get(api_url, "/events/", lang="en")

        by_slug: Dict[str, RemoteEvent] = {}

        def extract_common(item: dict) -> Tuple[Optional[str], dict]:
            slug = item.get("slug")
            org = item.get("organization") or {}
            cat = item.get("category") or {}
            verified_by = item.get("verified_by")
            tags = item.get("tags") or []
            common = {
                "starts_at": item.get("starts_at"),
                "ends_at": item.get("ends_at"),
                "location": item.get("location"),
                "url": item.get("url"),
                "verified": bool(item.get("verified")),
                "aspect_ratio": item.get("aspect_ratio"),
                "image_url": item.get("image_url"),
                "organization_slug": org.get("slug"),
                "category_slug": cat.get("slug"),
                "publication_date": item.get("publication_date"),
                "verified_at": item.get("verified_at"),
                "verified_by_username": verified_by if isinstance(verified_by, str) else (verified_by.get("username") if isinstance(verified_by, dict) else None),
                "tags": [tag.get("slug") for tag in tags if tag.get("slug")],
            }
            return slug, common

        # Index English by slug for merge
        en_by_slug: Dict[str, dict] = {}
        for item in events_en:
            slug, common = extract_common(item)
            if not slug:
                continue
            en_by_slug[slug] = {
                **common,
                "title_en": item.get("title"),
                "description_en": item.get("description"),
            }

        for item in events_pl:
            slug, common = extract_common(item)
            if not slug:
                continue
            merged = {
                **common,
                "title_pl": item.get("title"),
                "description_pl": item.get("description"),
            }
            if slug in en_by_slug:
                merged.update(en_by_slug[slug])
            by_slug[slug] = RemoteEvent(slug=slug, **merged)  # type: ignore[arg-type]

        if limit is not None and limit > 0:
            # Keep insertion order by slicing items
            limited = dict(list(by_slug.items())[:limit])
            return limited
        return by_slug

    # -----------------
    # Persist to local
    # -----------------
    def import_categories(self, data: Dict[str, RemoteCategory], dry_run: bool) -> None:
        created, updated = 0, 0
        for slug, rc in data.items():
            if dry_run:
                self.stdout.write(f"[DRY] Category {slug} -> pl={rc.name_pl!r}, en={rc.name_en!r}")
                continue

            obj, was_created = Category.objects.get_or_create(slug=slug, defaults={"name": rc.name_pl or slug})
            # Update translations if available
            if rc.name_pl is not None:
                setattr(obj, "name_pl", rc.name_pl)
            if rc.name_en is not None:
                setattr(obj, "name_en", rc.name_en)
            obj.save()
            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(self.style.SUCCESS(f"Categories: created={created}, updated={updated}"))

    def import_organizations(self, data: Dict[str, RemoteOrganization], dry_run: bool, force_images: bool) -> None:
        created, updated, images = 0, 0, 0
        for slug, ro in data.items():
            if dry_run:
                self.stdout.write(f"[DRY] Organization {slug} -> name={ro.name!r}, image={bool(ro.image_url)}")
                continue

            obj, was_created = Organization.objects.get_or_create(slug=slug, defaults={"name": ro.name})
            if not was_created and obj.name != ro.name and ro.name:
                obj.name = ro.name
            # Image handling
            if ro.image_url and (force_images or not obj.image):
                try:
                    filename, content = self._download_image(ro.image_url)
                    obj.image.save(filename, content, save=False)
                    images += 1
                except Exception as e:  # noqa: BLE001
                    self.stdout.write(self.style.WARNING(f"Organization {slug}: failed to download image: {e}"))
            obj.save()
            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(self.style.SUCCESS(f"Organizations: created={created}, updated={updated}, images_saved={images}"))

    def import_events(
        self,
        data: Dict[str, RemoteEvent],
        dry_run: bool,
        force_images: bool,
        org_index: Dict[str, Organization],
        cat_index: Dict[str, Category],
    ) -> None:
        created, updated, images = 0, 0, 0
        for slug, revent in data.items():
            if dry_run:
                self.stdout.write(
                    f"[DRY] Event {slug} -> org={revent.organization_slug}, cat={revent.category_slug}, "
                    f"image={bool(revent.image_url)}"
                )
                continue

            if not revent.organization_slug or revent.organization_slug not in org_index:
                self.stdout.write(self.style.WARNING(f"Skipping event {slug}: unknown organization"))
                continue
            if not revent.category_slug or revent.category_slug not in cat_index:
                self.stdout.write(self.style.WARNING(f"Skipping event {slug}: unknown category"))
                continue

            organization = org_index[revent.organization_slug]
            category = cat_index[revent.category_slug]

            # Parse datetimes first and validate
            starts_at = parse_datetime(revent.starts_at) if revent.starts_at else None
            ends_at = parse_datetime(revent.ends_at) if revent.ends_at else None
            if not starts_at or not ends_at:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping event {slug}: missing or invalid starts_at/ends_at"
                    )
                )
                continue

            # Parse publication_date
            publication_date = None
            if revent.publication_date:
                publication_date = parse_date(revent.publication_date)
                if not publication_date:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Event {slug}: invalid publication_date format '{revent.publication_date}', using starts_at date"
                        )
                    )
                    publication_date = starts_at.date()
            else:
                # Default to starts_at date if no publication_date provided
                publication_date = starts_at.date()
                if not dry_run:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Event {slug}: no publication_date provided, using starts_at date"
                        )
                    )

            # Parse verified_at
            verified_at = None
            if revent.verified_at:
                verified_at = parse_datetime(revent.verified_at)

            # Get verified_by user
            verified_by = None
            if revent.verified_by_username:
                try:
                    verified_by = User.objects.get(username=revent.verified_by_username)
                except User.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Event {slug}: verified_by user '{revent.verified_by_username}' not found"
                        )
                    )

            # Update existing or create new with all required fields set in one go
            obj = Event.objects.filter(slug=slug).first()
            if obj is None:
                obj = Event(
                    slug=slug,
                    organization=organization,
                    category=category,
                    starts_at=starts_at,
                    ends_at=ends_at,
                    verified=revent.verified,
                    publication_date=publication_date,
                    verified_at=verified_at,
                    verified_by=verified_by,
                )
                was_created = True
            else:
                was_created = False
                obj.organization = organization
                obj.category = category
                obj.starts_at = starts_at
                obj.ends_at = ends_at
                obj.verified = revent.verified
                obj.publication_date = publication_date
                obj.verified_at = verified_at
                obj.verified_by = verified_by

            # Assign translations and optional fields
            if revent.title_pl is not None:
                setattr(obj, "title_pl", revent.title_pl)
            if revent.title_en is not None:
                setattr(obj, "title_en", revent.title_en)
            if revent.description_pl is not None:
                setattr(obj, "description_pl", revent.description_pl)
            if revent.description_en is not None:
                setattr(obj, "description_en", revent.description_en)

            obj.location = revent.location
            obj.url = revent.url
            obj.aspect_ratio = revent.aspect_ratio

            # Image handling
            if revent.image_url and (force_images or not obj.image):
                try:
                    filename, content = self._download_image(revent.image_url)
                    obj.image.save(filename, content, save=False)
                    images += 1
                except Exception as e:  # noqa: BLE001
                    self.stdout.write(self.style.WARNING(f"Event {slug}: failed to download image: {e}"))

            obj.save()

            # Handle tags
            if revent.tags:
                tag_objects = []
                for tag_slug in revent.tags:
                    try:
                        tag_obj = Tag.objects.get(slug=tag_slug)
                        tag_objects.append(tag_obj)
                    except Tag.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f"Event {slug}: tag '{tag_slug}' not found, skipping")
                        )
                if tag_objects:
                    obj.tags.set(tag_objects)
                    if not dry_run:
                        self.stdout.write(
                            f"Event {slug}: assigned {len(tag_objects)} tags"
                        )

            created += int(was_created)
            updated += int(not was_created)

        self.stdout.write(self.style.SUCCESS(f"Events: created={created}, updated={updated}, images_saved={images}"))

    # ------
    # Entry
    # ------
    def handle(self, *args, **options):  # noqa: D401
        api_url: str = options["api_url"].rstrip("/")
        api_version: str = str(options.get("api_version", "v1")).strip("/")
        only: Optional[List[str]] = options.get("only")
        dry_run: bool = bool(options.get("dry_run"))
        force_images: bool = bool(options.get("force_images"))
        limit: Optional[int] = options.get("limit")
        allow_notifications: bool = bool(options.get("allow_notifications"))

        # Build versioned API URL, avoiding double version segments
        if api_url.split("/")[-1] == api_version:
            versioned_api_url = api_url
        else:
            versioned_api_url = f"{api_url}/{api_version}"

        self.stdout.write(f"Using API: {versioned_api_url}")

        # Suppress notifications by default for the duration of the command using settings
        from django.conf import settings as dj_settings
        previous_suppress = getattr(dj_settings, "SUPPRESS_NOTIFICATIONS", False)
        previous_suppress_discord = getattr(dj_settings, "SUPPRESS_DISCORD_NOTIFICATIONS", False)
        if not allow_notifications:
            setattr(dj_settings, "SUPPRESS_NOTIFICATIONS", True)
            setattr(dj_settings, "SUPPRESS_DISCORD_NOTIFICATIONS", True)

        import_all = not only
        import_categories = import_all or (only and "categories" in only)
        import_organizations = import_all or (only and "organizations" in only)
        import_events = import_all or (only and "events" in only)

        # Fetch remote data
        categories_map: Dict[str, RemoteCategory] = {}
        organizations_map: Dict[str, RemoteOrganization] = {}
        events_map: Dict[str, RemoteEvent] = {}

        try:
            if import_categories:
                self.stdout.write("Fetching categories...")
                categories_map = self.fetch_categories(versioned_api_url)

            if import_organizations:
                self.stdout.write("Fetching organizations...")
                organizations_map = self.fetch_organizations(versioned_api_url)

            if import_events:
                self.stdout.write("Fetching events...")
                events_map = self.fetch_events(versioned_api_url, limit=limit)
        except requests.HTTPError as e:
            self.stdout.write(self.style.ERROR(f"Failed to fetch data: {e}"))
            return

        try:
            # Persist locally
            if import_categories:
                self.import_categories(categories_map, dry_run=dry_run)

            if import_organizations:
                self.import_organizations(organizations_map, dry_run=dry_run, force_images=force_images)

            if import_events:
                # Build indices for FK resolution
                org_index = {o.slug: Organization.objects.get(slug=o.slug) for o in organizations_map.values()} if not dry_run else {}
                cat_index = {c.slug: Category.objects.get(slug=c.slug) for c in categories_map.values()} if not dry_run else {}
                self.import_events(
                    events_map,
                    dry_run=dry_run,
                    force_images=force_images,
                    org_index=org_index,
                    cat_index=cat_index,
                )

            self.stdout.write(self.style.SUCCESS("Import completed."))
        finally:
            # Restore previous env values
            setattr(dj_settings, "SUPPRESS_NOTIFICATIONS", previous_suppress)
            setattr(dj_settings, "SUPPRESS_DISCORD_NOTIFICATIONS", previous_suppress_discord)


