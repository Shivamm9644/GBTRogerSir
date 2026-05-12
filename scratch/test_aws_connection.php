<?php
// Test AWS Connection Script
// This script verifies if the PHP environment can successfully SSH/SCP to the AWS instance.

$awsIp = "107.21.88.198";
$pemPath = "C:\\Users\\shiva\\Downloads\\gbt_dashboard.pem";
$sshUser = "ubuntu";

echo "--- Starting AWS Connection Test ---\n";
echo "Target IP: $awsIp\n";
echo "PEM Path: $pemPath\n";

if (!file_exists($pemPath)) {
    die("ERROR: PEM file not found at $pemPath\n");
}

echo "Step 1: Testing SSH Connection (Running 'whoami')...\n";
$sshCmd = sprintf(
    'ssh -o StrictHostKeyChecking=no -i "%s" %s@%s "whoami" 2>&1',
    $pemPath,
    $sshUser,
    $awsIp
);

$output = shell_exec($sshCmd);
echo "SSH Output: $output\n";

if (trim($output) === 'ubuntu') {
    echo "SUCCESS: SSH connection verified!\n";
} else {
    echo "FAILED: SSH connection failed. Check if IP is correct and Key is valid.\n";
    exit;
}

echo "\nStep 2: Testing if deploy scripts exist on AWS...\n";
$checkCmd = sprintf(
    'ssh -o StrictHostKeyChecking=no -i "%s" %s@%s "ls -l /opt/app_deployer/run_fastlane.sh" 2>&1',
    $pemPath,
    $sshUser,
    $awsIp
);
$output = shell_exec($checkCmd);
echo "Check Output: $output\n";

if (strpos($output, 'run_fastlane.sh') !== false) {
    echo "SUCCESS: Remote scripts found!\n";
} else {
    echo "FAILED: Remote scripts not found. Did you run the setup commands on AWS?\n";
}

echo "\n--- Test Finished ---\n";
?>
