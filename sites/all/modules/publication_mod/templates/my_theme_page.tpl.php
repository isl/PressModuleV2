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
        print "\nvar templateLocation = \"";
         if($templateLocation){
            print $templateLocation . "\"; ";
        }else{
            print '"; ';
        }
        print "</script>";?>
    <script>
        var customAPA = jQuery.get(templateLocation + '/customAPA.csl');
        var chicago = jQuery.get(templateLocation + '/chicago-author-date.csl');
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
            const Cite = require('citation-js');
            var cite = csl_properties ? Cite(csl_properties) : null;
            var chicagoCite = "";
            if(cite) {
                let templateName = 'customAPA';
                let templateFile = templateLocation + 'customAPA.csl';
                var config = Cite.plugins.config.get('csl');
                $.when(customAPA).done(function(data){
                    config.templates.add(templateName, data);

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
                });
                $.when(chicago).done(function(data){
                    config.templates.add('chicago', data);
                    chicagoCite = cite.format('bibliography', {template:'chicago'});
                });
            }

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
                    case 'chicago':
                        $('#cite-export').text(chicagoCite);
                        break;
                    default:
                        $('#cite-export').text($(this).attr('data-cite'));
                        break;
                }
            });
        });
    </script>
</div>