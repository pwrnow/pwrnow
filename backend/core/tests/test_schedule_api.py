import datetime
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from core.models import Category, Organization, OrganizationCode, Event, Schedule, ScheduleItem


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def organization(db):
    return Organization.objects.create(name="Org A", slug="org-a")


@pytest.fixture
def other_organization(db):
    return Organization.objects.create(name="Org B", slug="org-b")


@pytest.fixture
def category(db):
    return Category.objects.create(name="Cat", slug="cat")


def authenticate_org(client: APIClient, organization: Organization):
    OrganizationCode.objects.create(organization=organization, code="TESTCODE1234")
    url = reverse("organization-authenticate")
    resp = client.post(url, {"code": "TESTCODE1234"}, format="json")
    assert resp.status_code == 200


def create_event(organization: Organization, category: Category, verified: bool) -> Event:
    now = timezone.now()
    return Event.objects.create(
        title="Test Event",
        slug="test-event",
        starts_at=now - datetime.timedelta(days=1),
        ends_at=now + datetime.timedelta(days=1),
        publication_date=(now - datetime.timedelta(days=1)).date(),
        organization=organization,
        category=category,
        verified=verified,
    )


def test_get_schedule_public_hidden_when_event_not_verified(db, api_client, organization, category):
    event = create_event(organization, category, verified=False)
    schedule = Schedule.objects.create(event=event)
    ScheduleItem.objects.create(
        schedule=schedule,
        date=event.starts_at.date(),
        start_time=datetime.time(9, 0),
        end_time=datetime.time(10, 0),
        title="Registration",
        description="",
    )

    url = reverse("event-get-schedule", kwargs={"slug": event.slug})
    resp = api_client.get(url)
    assert resp.status_code == 404


def test_get_schedule_public_visible_when_event_verified(db, api_client, organization, category):
    event = create_event(organization, category, verified=True)
    schedule = Schedule.objects.create(event=event)
    ScheduleItem.objects.create(
        schedule=schedule,
        date=event.starts_at.date(),
        start_time=datetime.time(9, 0),
        end_time=datetime.time(10, 0),
        title="Registration",
        description=None,
    )
    url = reverse("event-get-schedule", kwargs={"slug": event.slug})
    resp = api_client.get(url)
    assert resp.status_code == 200
    assert resp.json()["id"]
    assert len(resp.json()["items"]) == 1


def test_get_schedule_owner_can_view_unverified(db, api_client, organization, category):
    event = create_event(organization, category, verified=False)
    schedule = Schedule.objects.create(event=event)
    ScheduleItem.objects.create(
        schedule=schedule,
        date=event.starts_at.date(),
        start_time=datetime.time(9, 0),
        end_time=datetime.time(10, 0),
        title="Registration",
        description=None,
    )
    authenticate_org(api_client, organization)
    url = reverse("event-get-schedule", kwargs={"slug": event.slug})
    resp = api_client.get(url)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


def test_get_schedule_returns_null_when_no_schedule_exists(db, api_client, organization, category):
    event = create_event(organization, category, verified=True)
    url = reverse("event-get-schedule", kwargs={"slug": event.slug})
    resp = api_client.get(url)
    assert resp.status_code == 200
    # When no schedule exists, endpoint returns an empty body or JSON null
    assert resp.content in (b"", b"null")


def test_create_schedule_item_creates_schedule_if_missing(db, api_client, organization, category):
    event = create_event(organization, category, verified=False)
    authenticate_org(api_client, organization)
    payload = {
        "event_slug": event.slug,
        "date": event.starts_at.date().isoformat(),
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "title": "Opening",
        "description": "",
    }
    url = reverse("schedule-item-list")
    resp = api_client.post(url, payload, format="json")
    assert resp.status_code == 201
    item = ScheduleItem.objects.get(id=resp.json()["id"])
    assert item.schedule.event_id == event.id
    # schedule exists now
    assert Schedule.objects.filter(event=event).exists()


def test_create_schedule_item_forbidden_for_other_org(db, api_client, organization, other_organization, category):
    event = create_event(other_organization, category, verified=False)
    authenticate_org(api_client, organization)
    payload = {
        "event_slug": event.slug,
        "date": event.starts_at.date().isoformat(),
        "start_time": "10:00:00",
        "end_time": "11:00:00",
        "title": "Opening",
        "description": None,
    }
    url = reverse("schedule-item-list")
    resp = api_client.post(url, payload, format="json")
    assert resp.status_code == 400


def test_create_schedule_item_validates_time_order(db, api_client, organization, category):
    event = create_event(organization, category, verified=False)
    authenticate_org(api_client, organization)
    payload = {
        "event_slug": event.slug,
        "date": event.starts_at.date().isoformat(),
        "start_time": "11:00:00",
        "end_time": "10:00:00",
        "title": "Invalid",
        "description": None,
    }
    url = reverse("schedule-item-list")
    resp = api_client.post(url, payload, format="json")
    assert resp.status_code == 400
    assert "end_time" in resp.json()


def test_delete_schedule_item_requires_owner(db, api_client, organization, other_organization, category):
    # Create event with other org
    event = create_event(other_organization, category, verified=False)
    schedule = Schedule.objects.create(event=event)
    item = ScheduleItem.objects.create(
        schedule=schedule,
        date=event.starts_at.date(),
        start_time=datetime.time(9, 0),
        end_time=datetime.time(10, 0),
        title="Reg",
        description=None,
    )

    # Auth as first org (not owner)
    authenticate_org(api_client, organization)
    url = reverse("schedule-item-detail", kwargs={"pk": str(item.id)})
    resp = api_client.delete(url)
    assert resp.status_code == 403


def test_delete_schedule_item_owner_succeeds(db, api_client, organization, category):
    event = create_event(organization, category, verified=False)
    schedule = Schedule.objects.create(event=event)
    item = ScheduleItem.objects.create(
        schedule=schedule,
        date=event.starts_at.date(),
        start_time=datetime.time(9, 0),
        end_time=datetime.time(10, 0),
        title="Reg",
        description=None,
    )
    authenticate_org(api_client, organization)
    url = reverse("schedule-item-detail", kwargs={"pk": str(item.id)})
    resp = api_client.delete(url)
    assert resp.status_code == 204
    assert not ScheduleItem.objects.filter(id=item.id).exists()


