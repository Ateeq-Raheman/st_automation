import { callApi } from './client';

export const offerLetterApi = {
  getOfferLetters: (company) =>
    callApi('st_automation.api.offer_letter.get_offer_letters', { company }, 'GET'),

  getOfferLetterDetail: (offerName) =>
    callApi('st_automation.api.offer_letter.get_offer_letter_detail', { offer_name: offerName }, 'GET'),

  createOrUpdateOfferLetter: (data) =>
    callApi('st_automation.api.offer_letter.create_or_update_offer_letter', data),

  sendOfferLetter: (offerName) =>
    callApi('st_automation.api.offer_letter.send_standardtouch_offer_letter', { offer_name: offerName }),

  getResponsibilityPresets: () =>
    callApi('st_automation.api.offer_letter.get_responsibility_presets', {}, 'GET'),

  saveResponsibilityPreset: (roleName, responsibilities) =>
    callApi('st_automation.api.offer_letter.save_responsibility_preset', {
      role_name: roleName,
      responsibilities,
    }),

  deleteResponsibilityPreset: (roleName) =>
    callApi('st_automation.api.offer_letter.delete_responsibility_preset', {
      role_name: roleName,
    }),

  updateOfferStatus: (offerName, status) =>
    callApi('st_automation.api.offer_letter.update_offer_status', { offer_name: offerName, status }),
};
