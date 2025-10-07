/**
 * Calculates the time-based status for a process.
 * @param {object} process - The process object, expected to have startTime and endTime in 'HH:mm' format.
 * @param {Date} now - The current time.
 * @returns {{isButtonEnabled: boolean, spinnerClass: string}}
 */
export const getProcessTimeStatus = (process, now) => {
    if (!process.startTime || !process.endTime) {
        return { isButtonEnabled: false, spinnerClass: '' };
    }

    const today = now.toISOString().split('T')[0];
    const startTime = new Date(`${today}T${process.startTime}:00`);
    const endTime = new Date(`${today}T${process.endTime}:00`);

    if (now < startTime || now > endTime) {
        return { isButtonEnabled: false, spinnerClass: '' };
    }

    const totalDuration = endTime.getTime() - startTime.getTime();
    const elapsedTime = now.getTime() - startTime.getTime();
    const progressPercentage = (elapsedTime / totalDuration) * 100;

    let spinnerClass = 'text-success'; // Green
    if (progressPercentage >= 50 && progressPercentage < 83.33) {
        spinnerClass = 'text-warning'; // Yellow (for 1:30-1:49 in a 1h window)
    } else if (progressPercentage >= 83.33) {
        spinnerClass = 'text-danger'; // Red (for 1:50-2:00 in a 1h window)
    }

    return { isButtonEnabled: true, spinnerClass };
};