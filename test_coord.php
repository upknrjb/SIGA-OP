<?php
function parseCoordinate($coord) {
    if (empty($coord)) return null;
    $coord = str_replace([',', 'O'], ['.', 'E'], strtoupper(trim($coord)));
    if (is_numeric($coord)) return (float) $coord;
    
    // Check for DMS first
    if (preg_match('/(\d+)[^\d]+(\d+)[^\d]+([\d\.]+)[^\d]+([NSWE])/i', $coord, $matches)) {
        $deg = (float)$matches[1]; $min = (float)$matches[2]; $sec = (float)$matches[3]; $dir = $matches[4];
        $decimal = $deg + ($min / 60) + ($sec / 3600);
        if ($dir === 'S' || $dir === 'W') $decimal = $decimal * -1;
        return round($decimal, 8);
    }
    
    // Check for Decimal with direction
    if (preg_match('/([\d\.]+)[^\dNSWE]*([NSWE])/i', $coord, $matches)) {
        $decimal = (float)$matches[1]; $dir = $matches[2];
        if ($dir === 'S' || $dir === 'W') $decimal = $decimal * -1;
        return round($decimal, 8);
    }
    
    $cleaned = preg_replace('/[^0-9\.\-]/', '', $coord);
    if (is_numeric($cleaned)) return (float) $cleaned;
    return $coord;
}

var_dump(parseCoordinate('-0,9012'));
var_dump(parseCoordinate('119.8732'));
var_dump(parseCoordinate('0°53\'42.0"S'));
var_dump(parseCoordinate('119°51\'34.0"E'));
