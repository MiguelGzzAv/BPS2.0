/**
 * Calculates the time-based status for a process.
 * @param {object} process - The process object, expected to have startTime and endTime in 'HH:mm' format.
 * @param {Date} now - The current time.
 * @returns {{isButtonEnabled: boolean, spinnerClass: string}}
 */
export const getProcessTimeStatus = (process, now) => {
    if (!process.startTime || !process.endTime) {
        return { isButtonEnabled: false, spinnerClass: 'text-secondary' };
    }

    // Get current time in HH:mm format, which is timezone-independent for string comparison
    const currentTimeString = now.toTimeString().slice(0, 5);

    if (currentTimeString < process.startTime || currentTimeString > process.endTime) {
        return { isButtonEnabled: false, spinnerClass: 'text-secondary' };
    }

    // To calculate progress, we still need to parse the times.
    // We can assume they are all on the same arbitrary day for calculation purposes.
    const today = '1970-01-01';
    const startTime = new Date(`${today}T${process.startTime}:00`);
    const endTime = new Date(`${today}T${process.endTime}:00`);
    const currentTime = new Date(`${today}T${currentTimeString}:00`);

    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsedTime = currentTime.getTime() - startTime.getTime();

    // Handle cases crossing midnight
    if (totalDuration < 0) {
        // This case is not handled by the current logic, but a simple string comparison works for enabling the button.
        // For spinner logic, a more complex implementation would be needed if processes can span across midnight.
        // For now, we assume same-day processes for the spinner calculation.
        return { isButtonEnabled: true, spinnerClass: 'text-success' };
    }

    const progressPercentage = (elapsedTime / totalDuration) * 100;

    let spinnerClass = 'text-success'; // Green
    if (progressPercentage >= 50 && progressPercentage < 83.33) {
        spinnerClass = 'text-warning';
    } else if (progressPercentage >= 83.33) {
        spinnerClass = 'text-danger';
    }

    return { isButtonEnabled: true, spinnerClass };
};