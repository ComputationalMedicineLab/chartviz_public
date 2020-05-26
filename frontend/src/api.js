/**
 * API utility functions and constants
 */
import * as moment from 'moment';
import camelCase from 'lodash/camelCase';
import flow from 'lodash/flow';
import mapKeys from 'lodash/mapKeys';

/*
 * Helper funcs
 */
function apiURL(...parts) {
  const url = `/api/v1/${parts.join('/')}/`;
  return url.replace(/([^:]\/)\//g, "$1");
}

function csrftoken() {
  return document.cookie.split(';')
    .find(cookie => cookie.includes('csrftoken'))
    .split('=')[1];
}

async function safeFetch(url, opts={credentials: 'include'}) {
  const resp = await fetch(url, opts);
  if (resp.ok)
    return resp.json();
  else
    throw new Error(resp.status);
}

/*
 * Condition tab preference mgmt
 */
export function createCondition(patientId, phecodeId, threshold=0.4) {
  return safeFetch(apiURL('tabs', patientId), {
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify({threshold, condition_id: phecodeId}),
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken(),
    }
  });
}

export function deleteCondition(patientId, phecodeId) {
  return safeFetch(apiURL('tabs', patientId, phecodeId), {
    credentials: 'include',
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken(),
    }
  });
}

export function listConditions(patientId) {
  return safeFetch(apiURL('tabs', patientId));
}

/*
 * Basic API objects & non-tab methods
 */
export function fetchICD(id) {
  return safeFetch(apiURL('codes', 'icd', id));
}

export function fetchPatient(id) {
  return safeFetch(apiURL('patient', id));
}

export function fetchUser() {
  return safeFetch(apiURL('users', 'me'));
}

export function searchHistory(patientId, value, signal) {
  const base = apiURL('patient', patientId, 'code-search');
  const url = `${base}?term=${value}`;
  const options = { signal, credentials: 'include' };
  return safeFetch(url, options);
}

export function searchPatients(value) {
  const base = apiURL('patient');
  const url = `${base}?search=${value}`;
  return safeFetch(url);
}

/*
 * Tab API methods
 */
function recase(resp) {
  return mapKeys(resp, (v, k) => camelCase(k));
}

function _convert(datestring) {
  return moment(datestring);
}

function convertDategrid(resp) {
  resp.dategrid = resp.dategrid.map(_convert);
  return resp;
}

function convertMeds(resp) {
  resp.meds = resp.meds.map(med => ({
    ...med,
    events: med.events.map(_convert),
  }));
  return resp;
}

function _convertLab(lab) {
  return {
    ...lab,
    events: lab.events.map(event => ({
      ...event,
      datetime: _convert(event.datetime)
    }))
  };
}

function convertLabs(resp) {
  resp.labs.cbc = resp.labs.cbc.map(_convertLab);
  resp.labs.chem = resp.labs.chem.map(_convertLab);
  resp.labs.other = resp.labs.other.map(_convertLab);
  return resp;
}

function convertPhecodes(resp) {
  resp.phecodes = resp.phecodes.map(({icds, ...rest}) => ({
    ...rest,
    icds: icds.map(({events, ...rest}) => ({
      ...rest,
      events: events.map(_convert)
    })),
  }));
  return resp;
}

function convertCpts(resp) {
  resp.cpts = resp.cpts.map(({events, ...rest}) => ({
    ...rest,
    events: events.map(_convert)
  }));
  return resp;
}

export async function fetchConditionTab(patient, phecodeId) {
  const url = `${patient.conditions}?code=${phecodeId}`;
  const resp = await safeFetch(url);
  return flow(recase, convertDategrid, convertMeds, convertLabs)(resp);
}

export async function fetchLabsTab(patient) {
  let resp = await safeFetch(patient.labs);
  return flow(convertDategrid, convertLabs)(resp);
}

export async function fetchMedsTab(patient) {
  let resp = await safeFetch(patient.meds);
  return flow(convertDategrid, convertMeds)(resp);
}

export async function fetchOverviewTab(patient) {
  return flow(recase, convertDategrid, convertMeds, convertLabs, convertPhecodes)(await safeFetch(patient.overview));
}

export async function fetchProceduresTab(patient) {
  const resp = await safeFetch(patient.cpts);
  return flow(convertDategrid, convertCpts)(resp);
}

export async function fetchSystemsTab(patient) {
  let resp = await safeFetch(patient.systems);
  return convertDategrid(resp);
}

export async function fetchVitalsTab(patient) {
  let resp = await safeFetch(patient.vitals);
  function convertDate({ date, ...rest }) {
    return {...rest, date: moment(date)};
  }
  resp.bloodPressure = resp.bloodPressure.map(convertDate);
  resp.heartRate = resp.heartRate.map(convertDate);
  resp.respiratoryRate = resp.respiratoryRate.map(convertDate);
  resp.bmi = resp.bmi.map(convertDate);
  return resp;
}

export async function fetchNotesByDate(patient, date) {
  const dt = moment(date).format('YYYY-MM-DD');
  const { notes } = await safeFetch(`${patient.notes}?date=${dt}`);
  return notes.map(({date, doc_type, sub_type}) => ({
    date: moment(date),
    docType: doc_type,
    subType: sub_type,
  }));
}
