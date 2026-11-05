<?php

namespace Tests\Unit;

use App\Models\BonPlan;
use App\Services\ReservationService;
use Carbon\CarbonImmutable;
use PHPUnit\Framework\TestCase;

class ReservationServiceTest extends TestCase
{
    public function test_it_charges_by_started_hour_below_the_daily_cap(): void
    {
        $total = (new ReservationService)->calculateTotal(
            CarbonImmutable::parse('2026-11-01 09:00:00'),
            CarbonImmutable::parse('2026-11-01 10:01:00'),
            '10.00',
            '100.00',
        );

        $this->assertSame('20.00', $total);
    }

    public function test_it_rounds_up_a_partial_hour(): void
    {
        $total = (new ReservationService)->calculateTotal(
            CarbonImmutable::parse('2026-11-01 09:00:00'),
            CarbonImmutable::parse('2026-11-01 09:00:01'),
            '10.00',
            '100.00',
        );

        $this->assertSame('10.00', $total);
    }

    public function test_it_caps_each_twenty_four_hour_period_at_the_daily_rate(): void
    {
        $service = new ReservationService;
        $start = CarbonImmutable::parse('2026-11-01 09:00:00');

        $this->assertSame(
            '100.00',
            $service->calculateTotal($start, $start->addHours(24), '10.00', '100.00'),
        );
        $this->assertSame(
            '110.00',
            $service->calculateTotal($start, $start->addHours(25), '10.00', '100.00'),
        );
    }

    public function test_it_applies_a_repeating_hourly_package_to_the_best_price(): void
    {
        $offer = new BonPlan([
            'duree_forfait_heures' => 3,
            'duree_minimum_heures' => 3,
            'prix_forfait' => '10000.00',
        ]);
        $service = new ReservationService;
        $start = CarbonImmutable::parse('2026-11-01 09:00:00');

        $this->assertSame(
            '10000.00',
            $service->calculateTotal($start, $start->addHours(3), '5000.00', '100000.00', $offer),
        );
        $this->assertSame(
            '20000.00',
            $service->calculateTotal($start, $start->addHours(6), '5000.00', '100000.00', $offer),
        );
    }

    public function test_it_applies_a_seven_day_offer_to_every_day_once_eligible(): void
    {
        $offer = new BonPlan([
            'duree_forfait_heures' => 24,
            'duree_minimum_heures' => 168,
            'prix_forfait' => '12000.00',
        ]);
        $start = CarbonImmutable::parse('2026-11-01 09:00:00');

        $this->assertSame(
            '84000.00',
            (new ReservationService)->calculateTotal(
                $start,
                $start->addDays(7),
                '5000.00',
                '20000.00',
                $offer,
            ),
        );
    }
}
