/* ============================================================
   LEGAL — the brokerage boilerplate every printed document carries.

   One copy, loaded by all four listing builders, so a wording change
   lands on the Showsheet, the Brochure, the Buyer Package and the Seller
   Pitch at once. None of it is editable in any tool: a document that
   printed a wrong or missing disclaimer would be a compliance problem,
   not a design one.

   The text is the Showsheet's, which was the only tool carrying it.
   ============================================================ */
(function (global) {
  'use strict';

  /* The full listing disclaimer, ending in the brokerage line. Printed on
     every property document. */
  var DISCLAIMER =
    'The information set forth herein has been obtained from sources deemed reliable but is not ' +
    'guaranteed and is submitted subject to errors, omissions, change of price, prior sale, or ' +
    'withdrawal without notice. All dimensions and square footage are approximate and should be ' +
    'independently verified. Carrying costs, financing limits, flip tax, assessments, and sublet ' +
    'and pied-à-terre policies are subject to building documents and board approval. This is ' +
    'not intended to solicit property already listed. The Gasdaska Verdiglione Conlon Team at ' +
    'Douglas Elliman Real Estate · 575 Madison Avenue, New York, NY 10022. ' +
    'Equal Housing Opportunity.';

  /* The shorter form, for a document that is not about one listing — a
     buyer consultation carries no property to disclaim, but the brokerage
     and the housing line still belong on it. */
  var BROKERAGE =
    'The information set forth herein has been obtained from sources deemed reliable but is not ' +
    'guaranteed. This is not intended to solicit property already listed. ' +
    'The Gasdaska Verdiglione Conlon Team at Douglas Elliman Real Estate · ' +
    '575 Madison Avenue, New York, NY 10022. Equal Housing Opportunity.';

  /* Printed under any floor plan, in every tool that shows one. */
  var FLOORPLAN =
    'Floor plans are for illustrative purposes only. Dimensions and square footage are ' +
    'approximate and subject to verification.';

  /* The Showsheet sets its floor-plan note vertically up the edge of the
     sheet, where the sentence above would run off the page. Same promise,
     short enough to fit. */
  var FLOORPLAN_SHORT = 'All dimensions are approximate. Not to scale.';

  /* The block as it prints at the foot of a closing page. `kind` picks the
     wording: 'listing' (default) for a property document, 'brokerage' for
     one that is not about a specific listing. */
  function block(kind) {
    var text = kind === 'brokerage' ? BROKERAGE : DISCLAIMER;
    return '<div class="legal">' + text + '</div>';
  }

  global.GVC_LEGAL = {
    DISCLAIMER: DISCLAIMER,
    BROKERAGE: BROKERAGE,
    FLOORPLAN: FLOORPLAN,
    FLOORPLAN_SHORT: FLOORPLAN_SHORT,
    block: block
  };
})(window);
