<div class="mainContent" style="width: 100%">
        <?php 
        print "<script> var pub_info = ";
        if($json_encoded){
            print $json_encoded . "; ";
        }else{
            print 'null; ';
        }  
        print "\nvar csl_properties = ";
         if($cslProperties){
            print $cslProperties . "; ";
        }else{
            print 'null; ';
        }  
        print "</script>";?>
    <script>
        const Cite = require('citation-js');
        var cite = csl_properties ? Cite(csl_properties) : null;
        if(cite) {
            let templateName = 'customAPA';
            let template = '<?xml version=\"1.0\" encoding=\"utf-8\"?><style xmlns=\"http://purl.org/net/xbiblio/csl\" class=\"in-text\" version=\"1.0\" demote-non-dropping-particle=\"never\"><info><title>American Psychological Association 6th edition</title><title-short>APA</title-short><id>http: //www.zotero.org/styles/apa</id><link href=\"http://www.zotero.org/styles/apa\" rel=\"self\"/><link href=\"http://owl.english.purdue.edu/owl/resource/560/01/\" rel=\"documentation\"/><author><name>Simon Kornblith</name><email>simon@simonster.com</email></author><contributor><name>Bruce D\'Arcus</name></contributor><contributor><name>Curtis M. Humphrey</name></contributor><contributor><name>Richard Karnesky</name><email>karnesky+zotero@gmail.com</email><uri>http://arc.nucapt.northwestern.edu/Richard_Karnesky</uri></contributor><contributor><name>Sebastian Karcher</name></contributor><contributor><name> Brenton M. Wiernik</name><email>zotero@wiernik.org</email></contributor><category citation-format=\"author-date\"/><category field=\"psychology\"/><category field=\"generic-base\"/><updated>2016-05-25T09:01:49+00:00</updated><rights license=\"http://creativecommons.org/licenses/by-sa/3.0/\">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights></info><locale xml:lang=\"en\"><terms><term name=\"editortranslator\" form=\"short\"><single>ed. &amp; trans.</single><multiple>eds. &amp; trans.</multiple></term><term name=\"translator\" form=\"short\"><single>trans.</single><multiple>trans.</multiple></term></terms></locale><macro name=\"container-contributors\"><choose><if type=\"chapter paper-conference entry-dictionary entry-encyclopedia\" match=\"any\"><group delimiter=\", \"><names variable=\"container-author\" delimiter=\", \"><name and=\"symbol\" initialize-with=\". \" delimiter=\", \"/><label form=\"short\" prefix=\" (\" text-case=\"title\" suffix=\")\"/></names><names variable=\"editor translator\" delimiter=\", \"><name and=\"symbol\" initialize-with=\". \" delimiter=\", \"/><label form=\"short\" prefix=\" (\" text-case=\"title\" suffix=\")\"/></names></group></if></choose></macro><macro name=\"secondary-contributors\"><choose><if type=\"article-journal chapter paper-conference entry-dictionary entry-encyclopedia\" match=\"none\"><group delimiter=\", \" prefix=\" (\" suffix=\")\"><names variable=\"container-author\" delimiter=\", \"><name and=\"symbol\" initialize-with=\". \" delimiter=\", \"/><label form=\"short\" prefix=\", \" text-case=\"title\"/></names><names variable=\"editor translator\" delimiter=\", \"><name and=\"symbol\" initialize-with=\". \" delimiter=\", \"/><label form=\"short\" prefix=\", \" text-case=\"title\"/></names></group></if></choose></macro><macro name=\"author\"><names variable=\"author\"><name name-as-sort-order=\"all\" and=\"symbol\" sort-separator=\", \" initialize-with=\". \" delimiter=\", \" delimiter-precedes-last=\"always\"/><label form=\"short\" prefix=\" (\" suffix=\")\" text-case=\"capitalize-first\"/><substitute><names variable=\"editor\"/><names variable=\"translator\"/><choose><if type=\"report\"><text variable=\"publisher\"/><text macro=\"title\"/></if><else><text macro=\"title\"/></else></choose></substitute></names></macro><macro name=\"author-short\"><names variable=\"author\"><name form=\"short\" and=\"symbol\" delimiter=\", \" initialize-with=\". \"/><substitute><names variable=\"editor\"/><names variable=\"translator\"/><choose><if type=\"report\"><text variable=\"publisher\"/><text variable=\"title\" form=\"short\" font-style=\"italic\"/></if><else-if type=\"legal_case\"><text variable=\"title\" font-style=\"italic\"/></else-if><else-if type=\"bill book graphic legislation motion_picture song\" match=\"any\"><text variable=\"title\" form=\"short\" font-style=\"italic\"/></else-if><else-if variable=\"reviewed-author\"><choose><if variable=\"reviewed-title\" match=\"none\"><text variable=\"title\" form=\"short\" font-style=\"italic\" prefix=\"Review of \"/></if><else><text variable=\"title\" form=\"short\" quotes=\"true\"/></else></choose></else-if><else><text variable=\"title\" form=\"short\" quotes=\"true\"/></else></choose></substitute></names></macro><macro name=\"access\"><choose><if type=\"thesis report\" match=\"any\"><choose><if variable=\"DOI\" match=\"any\">\n                        <text variable=\"DOI\" prefix=\"https://doi.org/\"/></if><else-if variable=\"archive\" match=\"any\"><group><text variable=\"archive\" suffix=\".\"/><text variable=\"archive_location\" prefix=\" (\" suffix=\")\"/></group></else-if><else><group><text variable=\"URL\"/></group></else></choose></if><else><choose><if variable=\"DOI\"><text variable=\"DOI\" prefix=\"https://doi.org/\"/></if><else><choose><if type=\"webpage\"><group delimiter=\" \"><group><date variable=\"accessed\" form=\"text\" suffix=\", \"/></group><text variable=\"URL\"/></group></if><else><group><text variable=\"URL\"/></group></else></choose></else></choose></else></choose></macro><macro name=\"title\"><choose><if type=\"book graphic manuscript motion_picture report song speech thesis\" match=\"any\"><choose><if variable=\"version\" type=\"book\" match=\"all\"><text variable=\"title\"/></if><else><text variable=\"title\" font-style=\"italic\"/></else></choose></if><else-if variable=\"reviewed-author\"><choose><if variable=\"reviewed-title\"><group delimiter=\" \"><text variable=\"title\"/><group delimiter=\", \" prefix=\"[\" suffix=\"]\"><text variable=\"reviewed-title\" font-style=\"italic\" prefix=\"Review of \"/><names variable=\"reviewed-author\" delimiter=\", \"><label form=\"verb-short\" suffix=\" \"/><name and=\"symbol\" initialize-with=\". \" delimiter=\", \"/></names></group></group></if><else><group delimiter=\", \" prefix=\"[\" suffix=\"]\"><text variable=\"title\" font-style=\"italic\" prefix=\"Review of \"/><names variable=\"reviewed-author\" delimiter=\", \"><label form=\"verb-short\" suffix=\" \"/><name and=\"symbol\" initialize-with=\". \" delimiter=\", \"/></names></group></else></choose></else-if><else><text variable=\"title\"/></else></choose></macro><macro name=\"title-plus-extra\"><text macro=\"title\"/><choose><if type=\"report thesis\" match=\"any\"><group prefix=\" (\" suffix=\")\" delimiter=\", \"><group delimiter=\" \"><choose><if variable=\"genre\" match=\"any\"><text variable=\"genre\"/></if><else><text variable=\"collection-title\"/></else></choose><text variable=\"number\" prefix=\"No. \"/></group><group delimiter=\" \"><text term=\"version\" text-case=\"capitalize-first\"/><text variable=\"version\"/></group><text macro=\"edition\"/></group></if><else-if type=\"post-weblog webpage\" match=\"any\"><text variable=\"genre\" prefix=\" [\" suffix=\"]\"/></else-if><else-if variable=\"version\"><group delimiter=\" \" prefix=\" (\" suffix=\")\"><text term=\"version\" text-case=\"capitalize-first\"/><text variable=\"version\"/></group></else-if></choose><text macro=\"format\" prefix=\" [\" suffix=\"]\"/></macro><macro name=\"format\"><choose><if match=\"any\" variable=\"medium\"><text variable=\"medium\" text-case=\"capitalize-first\"/></if><else-if type=\"dataset\" match=\"any\"><text value=\"Data set\"/></else-if></choose></macro><macro name=\"publisher\"><choose><if type=\"report\" match=\"any\"><group delimiter=\": \"><text variable=\"publisher-place\"/><text variable=\"publisher\"/></group></if><else-if type=\"thesis\" match=\"any\"><group delimiter=\", \"><text variable=\"publisher\"/><text variable=\"publisher-place\"/></group></else-if><else-if type=\"post-weblog webpage\" match=\"none\"><group delimiter=\", \"><choose><if variable=\"event version\" type=\"speech motion_picture\" match=\"none\"><text variable=\"genre\"/></if></choose><choose><if type=\"article-journal article-magazine\" match=\"none\"><group delimiter=\": \"><choose><if variable=\"publisher-place\"><text variable=\"publisher-place\"/></if><else><text variable=\"event-place\"/></else></choose><text variable=\"publisher\"/></group></if></choose></group></else-if></choose></macro><macro name=\"event\"><choose><if variable=\"container-title\" match=\"none\"><choose><if variable=\"event\"><choose><if variable=\"genre\" match=\"none\"><text variable=\"event\"/></if><else>\n                                <group delimiter=\" \"><text variable=\"genre\" text-case=\"capitalize-first\"/><text variable=\"event\"/></group></else></choose></if><else-if type=\"speech\"><text variable=\"genre\" text-case=\"capitalize-first\"/></else-if></choose></if></choose></macro><macro name=\"issued\"><choose><if type=\"bill legal_case legislation\" match=\"none\"><choose><if variable=\"issued\"><group prefix=\" (\" suffix=\")\"><date variable=\"issued\"><date-part name=\"year\"/></date><text variable=\"year-suffix\"/><choose><if type=\"speech\" match=\"any\"><date variable=\"issued\"><date-part prefix=\", \" name=\"month\"/></date></if><else-if type=\"article-journal bill book chapter graphic legal_case legislation motion_picture paper-conference report song dataset\" match=\"none\"><date variable=\"issued\"><date-part prefix=\", \" name=\"month\"/><date-part prefix=\" \" name=\"day\"/></date></else-if></choose></group></if><else-if variable=\"status\"><group prefix=\" (\" suffix=\")\"><text variable=\"status\"/><text variable=\"year-suffix\" prefix=\"-\"/></group></else-if><else><group prefix=\" (\" suffix=\")\"><text term=\"no date\" form=\"short\"/><text variable=\"year-suffix\" prefix=\"-\"/></group></else></choose></if></choose></macro><macro name=\"issued-sort\"><choose><if type=\"article-journal bill book chapter graphic legal_case legislation motion_picture paper-conference report song dataset\" match=\"none\"><date variable=\"issued\"><date-part name=\"year\"/><date-part name=\"month\"/><date-part name=\"day\"/></date></if><else><date variable=\"issued\"><date-part name=\"year\"/></date></else></choose></macro><macro name=\"issued-year\"><choose><if variable=\"issued\"><group delimiter=\"/\"><date variable=\"original-date\" form=\"text\"/><group><date variable=\"issued\"><date-part name=\"year\"/></date><text variable=\"year-suffix\"/></group></group></if><else-if variable=\"status\"><text variable=\"status\"/><text variable=\"year-suffix\" prefix=\"-\"/></else-if><else><text term=\"no date\" form=\"short\"/><text variable=\"year-suffix\" prefix=\"-\"/></else></choose></macro><macro name=\"edition\"><choose><if is-numeric=\"edition\"><group delimiter=\" \"><number variable=\"edition\" form=\"ordinal\"/><text term=\"edition\" form=\"short\"/></group></if><else><text variable=\"edition\"/></else></choose></macro><macro name=\"locators\"><choose><if type=\"article-journal article-magazine\" match=\"any\"><group prefix=\", \" delimiter=\", \"><group><text variable=\"volume\" font-style=\"italic\"/><text variable=\"issue\" prefix=\"(\" suffix=\")\"/></group><text variable=\"page\"/></group><choose><if variable=\"issued\"><choose><if variable=\"page issue\" match=\"none\"><text variable=\"status\" prefix=\". \"/></if></choose></if></choose></if><else-if type=\"article-newspaper\"><group delimiter=\" \" prefix=\", \"><label variable=\"page\" form=\"short\"/><text variable=\"page\"/></group></else-if><else-if type=\"book graphic motion_picture report song chapter paper-conference entry-encyclopedia entry-dictionary\" match=\"any\"><group prefix=\" (\" suffix=\")\" delimiter=\", \"><choose><if type=\"report\" match=\"none\"><text macro=\"edition\"/></if></choose><choose><if variable=\"volume\" match=\"any\"><group><text term=\"volume\" form=\"short\" text-case=\"capitalize-first\" suffix=\" \"/><number variable=\"volume\" form=\"numeric\"/></group></if><else><group><text term=\"volume\" form=\"short\" plural=\"true\" text-case=\"capitalize-first\" suffix=\" \"/><number variable=\"number-of-volumes\" form=\"numeric\" prefix=\"1&#8211;\"/></group></else></choose><group><label variable=\"page\" form=\"short\" suffix=\" \"/><text variable=\"page\"/></group></group></else-if><else-if type=\"legal_case\"><group prefix=\" (\" suffix=\")\" delimiter=\" \"><text variable=\"authority\"/><date variable=\"issued\" form=\"text\"/></group></else-if><else-if type=\"bill legislation\" match=\"any\"><date variable=\"issued\" prefix=\" (\" suffix=\")\"><date-part name=\"year\"/></date></else-if></choose></macro><macro name=\"citation-locator\"><group><choose><if locator=\"chapter\"><label variable=\"locator\" form=\"long\" text-case=\"capitalize-first\"/></if><else><label variable=\"locator\" form=\"short\"/></else></choose><text variable=\"locator\" prefix=\" \"/></group></macro>\n    <macro name=\"container\"><choose><if type=\"post-weblog webpage\" match=\"none\"><group><choose><if type=\"chapter paper-conference entry-encyclopedia\" match=\"any\"><text term=\"in\" text-case=\"capitalize-first\" suffix=\" \"/></if></choose><group delimiter=\", \"><text macro=\"container-contributors\"/><text macro=\"secondary-contributors\"/><text macro=\"container-title\"/></group></group></if></choose></macro><macro name=\"container-title\"><choose><if type=\"article article-journal article-magazine article-newspaper\" match=\"any\"><text variable=\"container-title\" font-style=\"italic\" text-case=\"title\"/></if><else-if type=\"bill legal_case legislation\" match=\"none\"><text variable=\"container-title\" font-style=\"italic\"/></else-if></choose></macro><macro name=\"legal-cites\"><choose><if type=\"bill legal_case legislation\" match=\"any\"><group delimiter=\" \" prefix=\", \"><choose><if variable=\"container-title\"><text variable=\"volume\"/><text variable=\"container-title\"/><group delimiter=\" \"><text term=\"section\" form=\"symbol\"/><text variable=\"section\"/></group><text variable=\"page\"/></if><else><choose><if type=\"legal_case\"><text variable=\"number\" prefix=\"No. \"/></if><else><text variable=\"number\" prefix=\"Pub. L. No. \"/><group delimiter=\" \"><text term=\"section\" form=\"symbol\"/><text variable=\"section\"/></group></else></choose></else></choose></group></if></choose></macro><macro name=\"original-date\"><choose><if variable=\"original-date\"><group prefix=\"(\" suffix=\")\" delimiter=\" \"><text value=\"Original work published\"/><date variable=\"original-date\" form=\"text\"/></group></if></choose></macro><citation et-al-min=\"6\" et-al-use-first=\"1\" et-al-subsequent-min=\"3\" et-al-subsequent-use-first=\"1\" disambiguate-add-year-suffix=\"true\" disambiguate-add-names=\"true\" disambiguate-add-givenname=\"true\" collapse=\"year\" givenname-disambiguation-rule=\"primary-name\"><sort><key macro=\"author\"/><key macro=\"issued-sort\"/></sort><layout prefix=\"(\" suffix=\")\" delimiter=\"; \"><group delimiter=\", \"><text macro=\"author-short\"/><text macro=\"issued-year\"/><text macro=\"citation-locator\"/></group></layout></citation><bibliography hanging-indent=\"true\" et-al-min=\"8\" et-al-use-first=\"6\" et-al-use-last=\"true\" entry-spacing=\"0\" line-spacing=\"2\"><sort><key macro=\"author\"/><key macro=\"issued-sort\" sort=\"ascending\"/><key macro=\"title\"/></sort><layout><group suffix=\".\"><group delimiter=\". \"><text macro=\"author\"/><text macro=\"issued\"/><text macro=\"title-plus-extra\"/><text macro=\"container\"/></group><text macro=\"legal-cites\"/><text macro=\"locators\"/><group delimiter=\", \" prefix=\". \"><text macro=\"event\"/><text macro=\"publisher\"/></group></group><text macro=\"access\" prefix=\" \"/><text macro=\"original-date\" prefix=\" \"/></layout></bibliography></style>';
            let config = Cite.plugins.config.get('csl');
            config.templates.add(templateName, template);
        }
    </script>
    <svg id="icon-quote" class="icon-quote" viewBox="0 0 900 900" width="15" height="15" style="display: none;">
    <path unicode="" d="M429 314v-214q0-45-32-76t-76-31h-214q-44 0-76 31t-31 76v393q0 58 23 111t61 91 91 61 111 23h35q15 0 26-11t10-25v-72q0-14-10-25t-26-10h-35q-59 0-101-42t-42-101v-18q0-22 16-38t37-16h125q45 0 76-31t32-76z m500 0v-214q0-45-32-76t-76-31h-214q-44 0-76 31t-31 76v393q0 58 23 111t61 91 91 61 111 23h35q15 0 26-11t10-25v-72q0-14-10-25t-26-10h-35q-59 0-101-42t-42-101v-18q0-22 16-38t37-16h125q45 0 76-31t32-76z" horiz-adv-x="928.6" transform="scale(1,-1), translate(0, -900)"></path>
    </svg>
    <div class="mainside">
        <div class="sectionTitle">ICS Publications</div>
        <div id="content">

            <p>
                <?php if($title): ?><span class="titlePaper">
                    <?php print $title; ?></span>
                <?php endif; ?>
            </p>
        </div>
        <?php if(publication_mod_can_user_edit($pub_info['publicationUuid'])): ?>
                <div>
                    <ul class="tabs primary clearfix">
                        <li class="active">
                            <a href="#" class="active">View</a>
                        </li>
                        <li>
                            <?php print l('Edit', 'publication/edit', array(
                                        // 'attributes' => array('target' => '_blank'),
                                        'query' => array(
                                            'uuid' => $pub_info['publicationUuid'],
                                            'category' => $pub_info['type']['id'],
                                        ))); ?>
                        </li>
                    </ul>
                </div>
        <?php endif; ?>
    </div>
    <div class="mainContentLines">
        <div class="mainside">
            <div id="boxContainer">
                <div class="inner" style="border-top: none; border-left: none; width: 25%;">
                    <div class="textNumbers">
                        <?php if(isset($pub_info['year'])): ?>
                        <div class="element">
                            <p><?php print $pub_info['year'] ?><br>
                        </div>
                        <?php endif;?>

                        <div class="element">
                            <p>English<br>
                        </div>
                        
                        <?php if(isset($pub_info['type']['label'])): ?>
                        <div class="element">
                            <p><strong>CATEGORY</strong>
                                <p><?php print $pub_info['type']['label']?></p>
                        </div>
<?php endif;?>
                        <?php if(isset($pub_info['contributors'])): 
                            for ($i = 0; $i < count($pub_info['contributors']); $i++):
                                if(count($pub_info['contributors'][$i]['persons']) > 0): ?>
                        <div class="element">
                            <p><strong><?php print strtoupper($pub_info['contributors'][$i]['label']) ?></strong>
                                <p>
                                <?php  
                                $indexes = array_keys($pub_info['contributors'][$i]['persons']);
                                sort($indexes);
                                for($j = 0; $j < count($indexes); $j++):
                                    $index = $indexes[$j];?>
                                    <?php 
                                    $full_name = $pub_info['contributors'][$i]['persons'][$index]['givenName'] . ' ' . $pub_info['contributors'][$i]['persons'][$index]['familyName'];
                                    print l($full_name, 'publication/search-pub', array(
                                        'attributes' => array('target' => '_blank'),
                                        'query' => array(
                                            'reviewed' => 'false',
                                            'method' => 'advanced',
                                            'authors0' => $pub_info['contributors'][$i]['persons'][$index]['uri'],
                                    ))); ?><br/>
                                    
                                <?php
                                endfor;
                                ?>
                        </div>
                        <?php
                        endif;
                        endfor;
                        endif;
                        ?>
                        <?php if(isset($pub_info['tag']) && !empty($pub_info['tag'])): 
                            $tag_count = count($pub_info['tag'])?>
                        <div class="element">
                            <p><strong>TOPICS</strong></p>
                            <p>
                            <?php foreach ($pub_info['tag'] as $key => $tag):
                                print l('#'. $tag, 'publication/search-pub', array(
                                    'attributes' => array('target' => '_blank'),
                                    'query' => array(
                                        'reviewed' => 'false',
                                        'method' => 'advanced',
                                        'tags0' => $tag,
                                    )
                                ));
                                if ($key < $tag_count - 1) print " | ";
                            endforeach;?>
                        </p>
                        </div>
                        <?php 
                        endif;
                        ?>

                        <?php if(isset($pub_info['org']) && !empty($pub_info['org'])): ?>
                        <div class="element" style="<?php if(!isset($pub_info['project']) || empty($pub_info['project'])) print "border: none;" ?>">
                            <p><strong>ORGANIZATION</strong></p>
                                <p>
                                    <?php foreach ($pub_info['org'] as $key => $org): 
                                    print l($org['name'], 'publication/search-pub', array(
                                        'attributes' => array('target' => '_blank'),
                                        'query' => array(
                                            'reviewed' => 'false',
                                            'method' => 'advanced',
                                            'orgs0' => $org['name'],
                                        )
                                    ));?><br/>
                                    <?php endforeach; ?>
                                </p>
                        </div>
                    <?php endif; ?>
                        <?php if(isset($pub_info['project']) && !empty($pub_info['project'])): ?>
                        <div class="element" style="border: none;">
                            <p><strong>PROJECT</strong></p>
                                <p>
                                    <?php foreach($pub_info['project'] as $key => $project): ?>
                                    <a href="#" target="_blank"><?php print $project['name'] ?></a><br/>
                    <?php endforeach; ?>
                                </p>
                        </div>
                    <?php endif; ?>
                    </div>
                </div>
                <div>
                    <div class="inner" style="border-top: none; width: 75%;">
                        <div id="pubInfo" class="textNumbers">
                            <!-- <div class="citation">Baryannis, G., Kritikos, K., & Plexousakis, D. (2017). A
                                specification-based
                                QoS-aware design framework for service-based applications. <em>Service Oriented
                                    Computing and
                                    Applications, 11</em>(3), 301-314.
                            </div> -->
                            <?php if(isset($pub_info['englishAbstract']) && $pub_info['englishAbstract']): ?>
                            <p><span class="titleAbstract">Abstract</span></p>
                            <p><?php print $pub_info['englishAbstract'] ?></p>
                    <?php endif; ?>
                            <?php if(isset($pub_info['greekAbstract']) && $pub_info['greekAbstract']): ?>
                                    <p><span class="titleAbstract">Greek Abstract</span></p>
                                    <p><?php print $pub_info['greekAbstract'] ?></p>
                            <?php endif; ?>
                            <div class="element">
                                <?php if(isset($pub_info['externalLink']) && !empty($pub_info['externalLink'])): ?>
                                <p>Related Content: 
                                    <?php foreach($pub_info['externalLink'] as $key => $link): ?>
                                    <a href="<?php print $link?>" target="_blank">[<?php print $key+1 ?>]</a>
                        <?php endforeach; ?>
                    <?php endif; ?>
                            </div>
                            <div class="element" style="border-bottom: none;">
                                <?php if(isset($pub_info['doi'])): ?>
                                <p><strong>DOI</strong>: <a href="<?php
                                        if (strpos($pub_info['doi'], 'doi.org') === FALSE):
                                            print "https://doi.org/";
                                        endif;
                                        print $pub_info['doi'] 
                                    ?>" target="_blank"><?php print $pub_info['doi'] ?></a></p>
                                <?php endif;
                                    if (isset($pub_info['isbn'])):?>
                                    <p><strong>ISBN</strong>: <?php print $pub_info['isbn']; ?></p>
                                    <?php endif; ?>
                                    <p><a href="#">License</a></p>
                            </div>
                        </div>
                        <script>
                            if(cite){
                                var pubInfo = document.getElementById('pubInfo');
                                var citationDiv = document.createElement('div');
                                var node = document.createTextNode(cite.format('bibliography', {template: 'customAPA'}));
                                var textDiv = document.createElement('div');
                                textDiv.appendChild(node);
                                citationDiv.appendChild(textDiv);
                                citationDiv.classList.add("citation");
                                var quote = document.getElementById('icon-quote');
                                citeButton = document.createElement('button');
                                citeButton.id = 'cite-button';
                                citeButton.classList.add('cite-button');
                                citeButton.style = 'float:right';
                                citeButton.appendChild(quote);
                                citeButton.getElementsByTagName('svg')[0].style = '';
                                citationDiv.appendChild(citeButton);
                                pubInfo.insertBefore(citationDiv, pubInfo.firstChild);
                            }
                        </script>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="mainsideB"></div>
    <div id="citeModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="modal-close">&times;</span>
                <div class="modal-tab selected" data-cite="apa">APA</div>
                <div class="modal-tab" data-cite="bibtex">BibTex</div>
                <div class="modal-tab" data-cite="chicago">Chicago</div>
            </div>
            <div class="modal-body">
                <div id="cite-export"></div>
            </div>
        </div>
    </div>
    <script>
        jQuery(function($){
            var $modal = $('#citeModal');
            var $btn = $('#cite-button');
            var $span = $('.modal-close');
            
            $btn.click(function () {
                $modal.show();
            });
            $span.click(function () {
                $modal.hide();
            });

            $(window).click(function(event){
                // console.log(event);
                if(event.target == $modal[0]){
                    $modal.hide();
                }
            });
            // $('cite-export').click(function(){
            //     $(this).select();
            // })
            var apaCite = cite.format('bibliography', {template: 'customAPA'});
            var bibtexCite = cite.format('bibtex');
            $('#cite-export').text(apaCite);
            $('.modal-tab').click(function(event) {
                $('.modal-tab.selected').removeClass('selected');
                $('#cite-export').removeClass('bibtex');
                $(this).addClass('selected');
                switch ($(this).attr('data-cite')) {
                    case 'apa':
                        $('#cite-export').text(apaCite);
                        break;
                    case 'bibtex':
                        $('#cite-export').text(bibtexCite);
                        $('#cite-export').addClass('bibtex');
                        break;
                    default:
                        $('#cite-export').text($(this).attr('data-cite'));
                        break;
                }
            });
        });
    </script>
</div>